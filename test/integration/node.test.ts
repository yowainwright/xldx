import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Xldx } from "../../src/server";
import * as fs from "fs/promises";
import * as path from "path";

const TEST_OUTPUT_DIR = path.join(import.meta.dir, "output");

describe("Node.js Integration Tests", () => {
  beforeAll(async () => {
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  });

  describe("End-to-end XLSX generation", () => {
    it("should generate a valid XLSX file with simple data", async () => {
      const data = [
        { name: "Alice", age: 30, city: "New York" },
        { name: "Bob", age: 25, city: "Los Angeles" },
        { name: "Charlie", age: 35, city: "Chicago" }
      ];

      const xldx = new Xldx(data);
      xldx.createSheet(
        { name: "People" },
        { key: "name", header: "Name" },
        { key: "age", header: "Age" },
        { key: "city", header: "City" }
      );

      const filePath = path.join(TEST_OUTPUT_DIR, "simple.xlsx");
      await xldx.write(filePath);

      const stats = await fs.stat(filePath);
      expect(stats.size).toBeGreaterThan(0);

      // Read back and verify
      const fileData = await fs.readFile(filePath);
      const result = await Xldx.read(fileData);

      expect(result.sheets).toHaveLength(1);
      expect(result.sheets[0].name).toBe("People");
      expect(result.sheets[0].data[0]).toEqual(["Name", "Age", "City"]);
      expect(result.sheets[0].data[1]).toEqual(["Alice", 30, "New York"]);
    });

    it("should generate XLSX with multiple sheets", async () => {
      const xldx = new Xldx([{ id: 1 }]);

      xldx.createSheet(
        { name: "Sheet1" },
        { key: "id", header: "ID" }
      );

      const xldx2 = new Xldx([{ value: "test" }]);
      xldx2.createSheet(
        { name: "Data" },
        { key: "value", header: "Value" }
      );

      const filePath1 = path.join(TEST_OUTPUT_DIR, "multi1.xlsx");
      const filePath2 = path.join(TEST_OUTPUT_DIR, "multi2.xlsx");

      await xldx.write(filePath1);
      await xldx2.write(filePath2);

      const result1 = await Xldx.read(await fs.readFile(filePath1));
      const result2 = await Xldx.read(await fs.readFile(filePath2));

      expect(result1.sheets[0].name).toBe("Sheet1");
      expect(result2.sheets[0].name).toBe("Data");
    });

    it("should generate XLSX with patterns applied", async () => {
      const data = [
        { category: "A", value: 100 },
        { category: "B", value: 200 },
        { category: "A", value: 150 },
        { category: "C", value: 300 }
      ];

      const xldx = new Xldx(data);
      xldx.createSheet(
        { name: "Patterns" },
        {
          key: "category",
          header: "Category",
          patterns: { bgColorPattern: "colorPerDiff" }
        },
        {
          key: "value",
          header: "Value",
          patterns: { bgColorPattern: "zebra" }
        }
      );

      const filePath = path.join(TEST_OUTPUT_DIR, "patterns.xlsx");
      await xldx.write(filePath);

      const stats = await fs.stat(filePath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it("should generate XLSX with auto column widths", async () => {
      const data = [
        { short: "A", long: "This is a very long text that should affect column width" },
        { short: "B", long: "Another long text" }
      ];

      const xldx = new Xldx(data);
      xldx.createSheet(
        { name: "Widths" },
        { key: "short", header: "Short", width: "auto" },
        { key: "long", header: "Long Column", width: "auto" }
      );

      const filePath = path.join(TEST_OUTPUT_DIR, "widths.xlsx");
      await xldx.write(filePath);

      const stats = await fs.stat(filePath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it("should handle special characters in data", async () => {
      const data = [
        { text: "<xml>content</xml>" },
        { text: "Quotes: \"double\" and 'single'" },
        { text: "Ampersand: A & B" },
        { text: "Unicode: 日本語 한국어 🎉" }
      ];

      const xldx = new Xldx(data);
      xldx.createSheet(
        { name: "Special" },
        { key: "text", header: "Text" }
      );

      const filePath = path.join(TEST_OUTPUT_DIR, "special.xlsx");
      await xldx.write(filePath);

      const result = await Xldx.read(await fs.readFile(filePath));
      expect(result.sheets[0].data[1][0]).toBe("<xml>content</xml>");
      expect(result.sheets[0].data[4][0]).toBe("Unicode: 日本語 한국어 🎉");
    });

    it("should handle various data types", async () => {
      const data = [
        { string: "text", number: 123, float: 45.67, bool: true },
        { string: "", number: 0, float: -1.5, bool: false },
        { string: "null check", number: null, float: undefined, bool: null }
      ];

      const xldx = new Xldx(data);
      xldx.createSheet(
        { name: "Types" },
        { key: "string", header: "String" },
        { key: "number", header: "Number" },
        { key: "float", header: "Float" },
        { key: "bool", header: "Boolean" }
      );

      const filePath = path.join(TEST_OUTPUT_DIR, "types.xlsx");
      await xldx.write(filePath);

      const result = await Xldx.read(await fs.readFile(filePath));
      expect(result.sheets[0].data[1][0]).toBe("text");
      expect(result.sheets[0].data[1][1]).toBe(123);
      expect(result.sheets[0].data[1][3]).toBe(true);
      expect(result.sheets[0].data[2][3]).toBe(false);
    });

    it("should handle large datasets", async () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        score: Math.random() * 100
      }));

      const xldx = new Xldx(data);
      xldx.createSheet(
        { name: "LargeData" },
        { key: "id", header: "ID" },
        { key: "name", header: "Name" },
        { key: "email", header: "Email" },
        { key: "score", header: "Score" }
      );

      const filePath = path.join(TEST_OUTPUT_DIR, "large.xlsx");
      await xldx.write(filePath);

      const stats = await fs.stat(filePath);
      expect(stats.size).toBeGreaterThan(10000);

      const result = await Xldx.read(await fs.readFile(filePath));
      expect(result.sheets[0].data.length).toBe(1001); // header + 1000 rows
    });
  });

  describe("toBuffer", () => {
    it("should return a valid Buffer", async () => {
      const xldx = new Xldx([{ a: 1 }]);
      xldx.createSheet({ name: "Test" }, { key: "a" });

      const buffer = await xldx.toBuffer();

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      // ZIP signature
      expect(buffer[0]).toBe(0x50);
      expect(buffer[1]).toBe(0x4b);
    });
  });

  describe("write method", () => {
    it("should write file to disk", async () => {
      const xldx = new Xldx([{ test: "value" }]);
      xldx.createSheet({ name: "WriteTest" }, { key: "test" });

      const filePath = path.join(TEST_OUTPUT_DIR, "write-test.xlsx");
      await xldx.write(filePath);

      const stats = await fs.stat(filePath);
      expect(stats.size).toBeGreaterThan(0);
    });
  });


  describe("SheetsData format", () => {
    it("should generate XLSX from column-based data", async () => {
      const sheetsData = {
        sheets: [
          {
            name: "ColumnData",
            data: {
              name: ["Alice", "Bob", "Charlie"],
              score: [95, 87, 92]
            }
          }
        ]
      };

      const xldx = new Xldx(sheetsData);
      const filePath = path.join(TEST_OUTPUT_DIR, "column-data.xlsx");
      await xldx.write(filePath);

      const result = await Xldx.read(await fs.readFile(filePath));
      expect(result.sheets[0].data[1]).toEqual(["Alice", 95]);
      expect(result.sheets[0].data[2]).toEqual(["Bob", 87]);
    });
  });

  describe("Roundtrip: generate -> read -> verify", () => {
    it("should preserve all data through write/read cycle", async () => {
      const originalData = [
        { id: 1, name: "Test 1", active: true, score: 95.5 },
        { id: 2, name: "Test 2", active: false, score: 87.3 },
        { id: 3, name: "Test 3", active: true, score: 92.1 }
      ];

      const xldx = new Xldx(originalData);
      xldx.createSheet(
        { name: "Roundtrip" },
        { key: "id", header: "ID" },
        { key: "name", header: "Name" },
        { key: "active", header: "Active" },
        { key: "score", header: "Score" }
      );

      const filePath = path.join(TEST_OUTPUT_DIR, "roundtrip.xlsx");
      await xldx.write(filePath);

      const fileData = await fs.readFile(filePath);
      const result = await Xldx.read(fileData);

      expect(result.sheets[0].data[0]).toEqual(["ID", "Name", "Active", "Score"]);
      expect(result.sheets[0].data[1]).toEqual([1, "Test 1", true, 95.5]);
      expect(result.sheets[0].data[2]).toEqual([2, "Test 2", false, 87.3]);
      expect(result.sheets[0].data[3]).toEqual([3, "Test 3", true, 92.1]);
    });
  });
});
