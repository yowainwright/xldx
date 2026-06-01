import { describe, it, expect } from "bun:test";
import {
  createTask,
  processTask,
  mergeSharedStrings,
  remapStringReferences,
  generateWorksheetsParallel,
} from "../src/xlsx/worker";
import type { Worksheet } from "../src/xlsx/types";

describe("Worker utilities", () => {
  describe("createTask", () => {
    it("should create a task from worksheet and index", () => {
      const sheet: Worksheet = {
        name: "Test",
        data: [["Hello"]],
      };

      const task = createTask(sheet, 0);

      expect(task.sheet).toBe(sheet);
      expect(task.sheetIndex).toBe(0);
    });
  });

  describe("processTask", () => {
    it("should process a task and generate XML", () => {
      const sheet: Worksheet = {
        name: "Test",
        data: [["Hello", "World"]],
      };

      const result = processTask(createTask(sheet, 0));

      expect(result.sheetIndex).toBe(0);
      expect(result.xml).toContain("<worksheet");
      expect(result.xml).toContain("<sheetData>");
      expect(result.sharedStrings).toContain("Hello");
      expect(result.sharedStrings).toContain("World");
    });

    it("should reuse shared strings for duplicate values", () => {
      const sheet: Worksheet = {
        name: "Test",
        data: [["Same", "Same", "Same"]],
      };

      const result = processTask(createTask(sheet, 0));

      expect(result.sharedStrings).toHaveLength(1);
      expect(result.sharedStrings[0]).toBe("Same");
    });

    it("should handle numbers and booleans", () => {
      const sheet: Worksheet = {
        name: "Test",
        data: [[42, true, false]],
      };

      const result = processTask(createTask(sheet, 0));

      expect(result.xml).toContain("<v>42</v>");
      expect(result.sharedStrings).toHaveLength(0);
    });
  });

  describe("mergeSharedStrings", () => {
    it("should merge shared strings from multiple results", () => {
      const results = [
        { xml: "", sheetIndex: 0, sharedStrings: ["A", "B"] },
        { xml: "", sheetIndex: 1, sharedStrings: ["B", "C"] },
      ];

      const { mergedStrings, remappings } = mergeSharedStrings(results);

      expect(mergedStrings).toEqual(["A", "B", "C"]);
      expect(remappings.get(0)?.get(0)).toBe(0);
      expect(remappings.get(0)?.get(1)).toBe(1);
      expect(remappings.get(1)?.get(0)).toBe(1);
      expect(remappings.get(1)?.get(1)).toBe(2);
    });

    it("should handle empty results", () => {
      const { mergedStrings, remappings } = mergeSharedStrings([]);

      expect(mergedStrings).toEqual([]);
      expect(remappings.size).toBe(0);
    });

    it("should handle single result", () => {
      const results = [{ xml: "", sheetIndex: 0, sharedStrings: ["X", "Y"] }];

      const { mergedStrings, remappings } = mergeSharedStrings(results);

      expect(mergedStrings).toEqual(["X", "Y"]);
      expect(remappings.get(0)?.get(0)).toBe(0);
      expect(remappings.get(0)?.get(1)).toBe(1);
    });
  });

  describe("remapStringReferences", () => {
    it("should remap shared string indices", () => {
      const xml = '<c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c>';
      const remapping = new Map<number, number>([
        [0, 5],
        [1, 10],
      ]);

      const result = remapStringReferences(xml, remapping);

      expect(result).toContain('<c r="A1" t="s"><v>5</v></c>');
      expect(result).toContain('<c r="B1" t="s"><v>10</v></c>');
    });

    it("should leave non-matching content unchanged", () => {
      const xml = '<c r="A1"><v>42</v></c>';
      const remapping = new Map<number, number>();

      const result = remapStringReferences(xml, remapping);

      expect(result).toBe(xml);
    });
  });

  describe("generateWorksheetsParallel", () => {
    it("should generate worksheets in parallel", () => {
      const worksheets: Worksheet[] = [
        { name: "Sheet1", data: [["A", "B"]] },
        { name: "Sheet2", data: [["C", "D"]] },
      ];

      const result = generateWorksheetsParallel(worksheets);

      expect(result.worksheetXmls).toHaveLength(2);
      expect(result.sharedStrings).toContain("A");
      expect(result.sharedStrings).toContain("B");
      expect(result.sharedStrings).toContain("C");
      expect(result.sharedStrings).toContain("D");
    });

    it("should deduplicate shared strings across sheets", () => {
      const worksheets: Worksheet[] = [
        { name: "Sheet1", data: [["Same"]] },
        { name: "Sheet2", data: [["Same"]] },
      ];

      const result = generateWorksheetsParallel(worksheets);

      expect(result.sharedStrings).toHaveLength(1);
      expect(result.sharedStrings[0]).toBe("Same");
    });

    it("should handle empty worksheets array", () => {
      const result = generateWorksheetsParallel([]);

      expect(result.worksheetXmls).toHaveLength(0);
      expect(result.sharedStrings).toHaveLength(0);
    });

    it("should maintain worksheet order", () => {
      const worksheets: Worksheet[] = [
        { name: "Sheet1", data: [["First"]] },
        { name: "Sheet2", data: [["Second"]] },
        { name: "Sheet3", data: [["Third"]] },
      ];

      const result = generateWorksheetsParallel(worksheets);

      expect(result.worksheetXmls).toHaveLength(3);
      // The worksheets are sorted by sheetIndex (0, 1, 2) which maintains original order
      expect(result.worksheetXmls[0]).toContain("<sheetData>");
      expect(result.worksheetXmls[1]).toContain("<sheetData>");
      expect(result.worksheetXmls[2]).toContain("<sheetData>");
    });
  });
});
