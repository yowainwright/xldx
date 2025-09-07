import { describe, it, expect } from "bun:test";
import {
  fontStyleSchema,
  fillStyleSchema,
  borderStyleSchema,
  bordersStyleSchema,
  alignmentStyleSchema,
  cellStyleSchema,
  patternContextSchema,
  columnPatternSchema,
  rowStyleOverrideSchema,
  columnDefinitionSchema,
  sheetOptionsSchema,
  xlsxBuilderOptionsSchema,
} from "../src/schemas";

describe("Schema Validation", () => {
  describe("fontStyleSchema", () => {
    it("should validate valid font style", () => {
      const valid = {
        name: "Arial",
        size: 12,
        bold: true,
        italic: false,
        underline: true,
        strike: false,
        color: "FF000000",
      };

      const result = fontStyleSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should allow partial font style", () => {
      const partial = { bold: true };
      const result = fontStyleSchema.safeParse(partial);
      expect(result.success).toBe(true);
    });

    it("should allow empty object", () => {
      const result = fontStyleSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should reject invalid types", () => {
      const invalid = { size: "large" };
      const result = fontStyleSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("fillStyleSchema", () => {
    it("should validate valid fill style", () => {
      const valid = {
        type: "pattern",
        pattern: "solid",
        fgColor: "FF0000FF",
        bgColor: "FFFFFFFF",
      };

      const result = fillStyleSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should validate gradient type", () => {
      const gradient = { type: "gradient" };
      const result = fillStyleSchema.safeParse(gradient);
      expect(result.success).toBe(true);
    });

    it("should reject invalid pattern", () => {
      const invalid = { pattern: "invalid" };
      const result = fillStyleSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("borderStyleSchema", () => {
    it("should validate valid border style", () => {
      const valid = {
        style: "thin",
        color: "FF000000",
      };

      const result = borderStyleSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should validate all border styles", () => {
      const styles = ["thin", "medium", "thick", "double", "dotted", "dashed", "none"];
      styles.forEach(style => {
        const result = borderStyleSchema.safeParse({ style });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("bordersStyleSchema", () => {
    it("should validate complete borders", () => {
      const valid = {
        top: { style: "thin", color: "FF000000" },
        left: { style: "medium" },
        bottom: { style: "thick" },
        right: { style: "double" },
        diagonal: { style: "dotted" },
        diagonalUp: true,
        diagonalDown: false,
      };

      const result = bordersStyleSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should allow partial borders", () => {
      const partial = { top: { style: "thin" } };
      const result = bordersStyleSchema.safeParse(partial);
      expect(result.success).toBe(true);
    });
  });

  describe("alignmentStyleSchema", () => {
    it("should validate valid alignment", () => {
      const valid = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
        shrinkToFit: false,
        indent: 2,
        readingOrder: 1,
        textRotation: 45,
      };

      const result = alignmentStyleSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should validate all horizontal alignments", () => {
      const alignments = ["left", "center", "right", "fill", "justify", "centerContinuous", "distributed"];
      alignments.forEach(horizontal => {
        const result = alignmentStyleSchema.safeParse({ horizontal });
        expect(result.success).toBe(true);
      });
    });

    it("should validate all vertical alignments", () => {
      const alignments = ["top", "middle", "bottom", "distributed", "justify"];
      alignments.forEach(vertical => {
        const result = alignmentStyleSchema.safeParse({ vertical });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("cellStyleSchema", () => {
    it("should validate complete cell style", () => {
      const valid = {
        font: { bold: true, size: 12 },
        fill: { type: "pattern", pattern: "solid", fgColor: "FF0000FF" },
        border: { top: { style: "thin" } },
        alignment: { horizontal: "center", vertical: "middle" },
        numFmt: "$#,##0.00",
      };

      const result = cellStyleSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should allow empty cell style", () => {
      const result = cellStyleSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("patternContextSchema", () => {
    it("should validate valid pattern context", () => {
      const valid = {
        rowIndex: 2,
        columnIndex: 1,
        value: "test",
        previousValue: "prev",
        rowData: { id: 1, name: "test" },
        allData: [{ id: 1 }, { id: 2 }],
        columnKey: "name",
      };

      const result = patternContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should allow undefined previousValue", () => {
      const valid = {
        rowIndex: 1,
        columnIndex: 0,
        value: "test",
        rowData: {},
        allData: [],
        columnKey: "col1",
      };

      const result = patternContextSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("columnPatternSchema", () => {
    it("should validate pattern with string values", () => {
      const valid = {
        bgColorPattern: "zebra",
        textPattern: "colorPerDiff",
      };

      const result = columnPatternSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should validate pattern with function", () => {
      const patternFn = () => null;
      const valid = {
        bgColorPattern: patternFn,
        custom: [patternFn],
      };

      const result = columnPatternSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should allow empty pattern", () => {
      const result = columnPatternSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("rowStyleOverrideSchema", () => {
    it("should validate numeric keys", () => {
      const valid = {
        1: { font: { bold: true } },
        2: { fill: { type: "pattern", pattern: "solid" } },
        10: { alignment: { horizontal: "center" } },
      };

      const result = rowStyleOverrideSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should validate string keys", () => {
      const valid = {
        "header": { font: { bold: true } },
        "1": { fill: { type: "pattern" } },
      };

      const result = rowStyleOverrideSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("columnDefinitionSchema", () => {
    it("should validate complete column definition", () => {
      const valid = {
        key: "name",
        header: "Name",
        width: 20,
        style: { font: { bold: true } },
        patterns: { bgColorPattern: "zebra" },
        rows: { 1: { font: { bold: true } } },
      };

      const result = columnDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should validate width as auto", () => {
      const valid = {
        key: "col1",
        width: "auto",
      };

      const result = columnDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should require key", () => {
      const invalid = { header: "Name" };
      const result = columnDefinitionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should validate minimal column", () => {
      const valid = { key: "id" };
      const result = columnDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("sheetOptionsSchema", () => {
    it("should validate complete sheet options", () => {
      const valid = {
        name: "Sheet1",
        freezePane: { row: 1, column: 2 },
        defaultRowHeight: 20,
        showGridLines: true,
        showRowColHeaders: false,
        defaultStyle: { font: { bold: true } },
      };

      const result = sheetOptionsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should require name", () => {
      const invalid = { freezePane: { row: 1, column: 0 } };
      const result = sheetOptionsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should validate minimal sheet", () => {
      const valid = { name: "Sheet1" };
      const result = sheetOptionsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("xlsxBuilderOptionsSchema", () => {
    it("should validate complete options", () => {
      const valid = {
        debug: true,
        customPatterns: {
          myPattern: () => null,
        },
      };

      const result = xlsxBuilderOptionsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should allow empty options", () => {
      const result = xlsxBuilderOptionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should validate debug flag", () => {
      const valid = { debug: false };
      const result = xlsxBuilderOptionsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});