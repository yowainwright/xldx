import { describe, it, expect } from "bun:test";
import {
  zebraBg,
  bgColorBasedOnDiff,
  colorPerDiff,
  txtColorBasedOnDiff,
  createSetWidthBasedOnCharacterCount,
  customizeInput,
  applyPattern,
  buildPatternContext,
  resolveCellStyles,
  buildCellProcessingData,
  processCellData,
  setTheme,
  buildWorksheetViews
} from "../src/utils";
import { defaultTheme } from "../src/themes";
import type { PatternContext, DataRow, CellStyle, ColumnDefinition } from "../src";

describe("Pattern Functions", () => {
  describe("zebraBg", () => {
    it("should apply background to even rows", () => {
      const context: PatternContext = {
        rowIndex: 2,
        columnIndex: 0,
        value: "test",
        rowData: { col1: "test" },
        allData: [{ col1: "test" }],
        columnKey: "col1"
      };
      
      const result = zebraBg(context);
      expect(result).toEqual({
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: defaultTheme.base[100]
        }
      });
    });

    it("should return null for odd rows", () => {
      const context: PatternContext = {
        rowIndex: 3,
        columnIndex: 0,
        value: "test",
        rowData: { col1: "test" },
        allData: [{ col1: "test" }],
        columnKey: "col1"
      };
      
      const result = zebraBg(context);
      expect(result).toBeNull();
    });
  });

  describe("bgColorBasedOnDiff", () => {
    it("should assign unique colors to unique values", () => {
      const allData: DataRow[] = [
        { category: "A" },
        { category: "B" },
        { category: "C" },
        { category: "A" }
      ];

      const contextA: PatternContext = {
        rowIndex: 1,
        columnIndex: 0,
        value: "A",
        rowData: { category: "A" },
        allData,
        columnKey: "category"
      };

      const contextB: PatternContext = {
        rowIndex: 2,
        columnIndex: 0,
        value: "B",
        rowData: { category: "B" },
        allData,
        columnKey: "category"
      };

      const contextC: PatternContext = {
        rowIndex: 3,
        columnIndex: 0,
        value: "C",
        rowData: { category: "C" },
        allData,
        columnKey: "category"
      };

      const resultA = bgColorBasedOnDiff(contextA);
      const resultB = bgColorBasedOnDiff(contextB);
      const resultC = bgColorBasedOnDiff(contextC);

      expect(resultA?.fill?.fgColor).toBeDefined();
      expect(resultB?.fill?.fgColor).toBeDefined();
      expect(resultC?.fill?.fgColor).toBeDefined();
      
      expect(resultA?.fill?.fgColor).not.toEqual(resultB?.fill?.fgColor);
      expect(resultB?.fill?.fgColor).not.toEqual(resultC?.fill?.fgColor);
      expect(resultA?.fill?.fgColor).not.toEqual(resultC?.fill?.fgColor);
    });

    it("should return same color for same values", () => {
      const allData: DataRow[] = [
        { category: "A" },
        { category: "B" },
        { category: "A" }
      ];

      const context1: PatternContext = {
        rowIndex: 1,
        columnIndex: 0,
        value: "A",
        rowData: { category: "A" },
        allData,
        columnKey: "category"
      };

      const context2: PatternContext = {
        rowIndex: 3,
        columnIndex: 0,
        value: "A",
        rowData: { category: "A" },
        allData,
        columnKey: "category"
      };

      const result1 = bgColorBasedOnDiff(context1);
      const result2 = bgColorBasedOnDiff(context2);

      expect(result1?.fill?.fgColor).toEqual(result2?.fill?.fgColor);
    });

    it("should handle null and undefined values", () => {
      const allData: DataRow[] = [
        { category: null },
        { category: undefined },
        { category: "A" }
      ];

      const contextNull: PatternContext = {
        rowIndex: 1,
        columnIndex: 0,
        value: null,
        rowData: { category: null },
        allData,
        columnKey: "category"
      };

      const contextUndefined: PatternContext = {
        rowIndex: 2,
        columnIndex: 0,
        value: undefined,
        rowData: { category: undefined },
        allData,
        columnKey: "category"
      };

      const resultNull = bgColorBasedOnDiff(contextNull);
      const resultUndefined = bgColorBasedOnDiff(contextUndefined);

      expect(resultNull).toBeNull();
      expect(resultUndefined).toBeNull();
    });
  });

  describe("colorPerDiff", () => {
    it("should be an alias for bgColorBasedOnDiff", () => {
      expect(colorPerDiff).toBe(bgColorBasedOnDiff);
    });
  });

  describe("txtColorBasedOnDiff", () => {
    it("should highlight changed values", () => {
      const context: PatternContext = {
        rowIndex: 2,
        columnIndex: 0,
        value: "new",
        previousValue: "old",
        rowData: { col1: "new" },
        allData: [{ col1: "old" }, { col1: "new" }],
        columnKey: "col1"
      };

      const result = txtColorBasedOnDiff(context);
      expect(result).toEqual({
        font: {
          color: defaultTheme.primary,
          bold: true
        }
      });
    });

    it("should return null for unchanged values", () => {
      const context: PatternContext = {
        rowIndex: 2,
        columnIndex: 0,
        value: "same",
        previousValue: "same",
        rowData: { col1: "same" },
        allData: [{ col1: "same" }, { col1: "same" }],
        columnKey: "col1"
      };

      const result = txtColorBasedOnDiff(context);
      expect(result).toBeNull();
    });

    it("should return null when no previous value", () => {
      const context: PatternContext = {
        rowIndex: 1,
        columnIndex: 0,
        value: "first",
        rowData: { col1: "first" },
        allData: [{ col1: "first" }],
        columnKey: "col1"
      };

      const result = txtColorBasedOnDiff(context);
      expect(result).toBeNull();
    });
  });
});

describe("Width Calculation", () => {
  describe("createSetWidthBasedOnCharacterCount", () => {
    it("should calculate average width by default", () => {
      const columnData = ["short", "medium text", "long text with more characters"];
      const calculator = createSetWidthBasedOnCharacterCount(columnData);
      const result = calculator();

      expect(result).toBeDefined();
      expect(result?.width).toBeGreaterThan(10);
      expect(result?.width).toBeLessThan(100);
      expect(result?.wrapText).toBe(true);
    });

    it("should calculate max width when specified", () => {
      const columnData = ["a", "bb", "ccc", "dddd"];
      const calculator = createSetWidthBasedOnCharacterCount(columnData, { method: "max" });
      const result = calculator();

      expect(result).toBeDefined();
      expect(result?.width).toBeGreaterThanOrEqual(10);
    });

    it("should calculate median width when specified", () => {
      const columnData = ["a", "bb", "ccc", "dddd", "eeeee"];
      const calculator = createSetWidthBasedOnCharacterCount(columnData, { method: "median" });
      const result = calculator();

      expect(result).toBeDefined();
      expect(result?.width).toBeGreaterThanOrEqual(10);
    });

    it("should respect min and max width constraints", () => {
      const columnData = ["x".repeat(200)];
      const calculator = createSetWidthBasedOnCharacterCount(columnData, {
        minWidth: 20,
        maxWidth: 50
      });
      const result = calculator();

      expect(result?.width).toBe(50);
    });

    it("should handle empty data", () => {
      const columnData: unknown[] = [];
      const calculator = createSetWidthBasedOnCharacterCount(columnData);
      const result = calculator();

      expect(result).toBeNull();
    });

    it("should handle null and undefined values", () => {
      const columnData = [null, undefined, "", "test"];
      const calculator = createSetWidthBasedOnCharacterCount(columnData);
      const result = calculator();

      expect(result).toBeDefined();
      expect(result?.width).toBeGreaterThan(0);
    });

    it("should use sample size", () => {
      const columnData = Array(1000).fill("test");
      const calculator = createSetWidthBasedOnCharacterCount(columnData, { sampleSize: 10 });
      const result = calculator();

      expect(result).toBeDefined();
    });

    it("should apply character width multiplier", () => {
      const columnData = ["test"];
      const calculator1 = createSetWidthBasedOnCharacterCount(columnData, { 
        charWidth: 1,
        minWidth: 5
      });
      const calculator2 = createSetWidthBasedOnCharacterCount(columnData, { 
        charWidth: 2,
        minWidth: 5
      });
      
      const result1 = calculator1();
      const result2 = calculator2();

      expect(result2?.width).toBeGreaterThan(result1?.width!);
    });
  });
});

describe("customizeInput", () => {
  it("should match exact string", () => {
    const pattern = customizeInput("exact");
    const context: PatternContext = {
      rowIndex: 1,
      columnIndex: 0,
      value: "exact",
      rowData: { col: "exact" },
      allData: [{ col: "exact" }],
      columnKey: "col"
    };

    const result = pattern(context);
    expect(result).toEqual({
      font: { color: defaultTheme.text.primary }
    });
  });

  it("should not match different string", () => {
    const pattern = customizeInput("exact");
    const context: PatternContext = {
      rowIndex: 1,
      columnIndex: 0,
      value: "different",
      rowData: { col: "different" },
      allData: [{ col: "different" }],
      columnKey: "col"
    };

    const result = pattern(context);
    expect(result).toBeNull();
  });

  it("should match with case insensitive fast match", () => {
    const pattern = customizeInput({ fastMatch: "TEST", caseSensitive: false });
    const context: PatternContext = {
      rowIndex: 1,
      columnIndex: 0,
      value: "test",
      rowData: { col: "test" },
      allData: [{ col: "test" }],
      columnKey: "col"
    };

    const result = pattern(context);
    expect(result).toEqual({
      font: { color: defaultTheme.text.primary }
    });
  });

  it("should match with regex pattern", () => {
    const pattern = customizeInput({ pattern: /^test\d+$/ });
    const context: PatternContext = {
      rowIndex: 1,
      columnIndex: 0,
      value: "test123",
      rowData: { col: "test123" },
      allData: [{ col: "test123" }],
      columnKey: "col"
    };

    const result = pattern(context);
    expect(result).toEqual({
      font: { color: defaultTheme.text.primary }
    });
  });
});

describe("Pattern Application", () => {
  describe("applyPattern", () => {
    it("should apply built-in pattern by name", () => {
      const context: PatternContext = {
        rowIndex: 2,
        columnIndex: 0,
        value: "test",
        rowData: { col: "test" },
        allData: [{ col: "test" }],
        columnKey: "col"
      };

      const result = applyPattern("zebra", context);
      expect(result).toBeDefined();
      expect(result?.fill).toBeDefined();
    });

    it("should apply custom pattern", () => {
      const customPattern = (ctx: PatternContext) => ({
        font: { color: "#FF0000" }
      });

      const context: PatternContext = {
        rowIndex: 1,
        columnIndex: 0,
        value: "test",
        rowData: { col: "test" },
        allData: [{ col: "test" }],
        columnKey: "col"
      };

      const result = applyPattern("myPattern", context, { myPattern: customPattern });
      expect(result).toEqual({ font: { color: "#FF0000" } });
    });

    it("should apply function pattern directly", () => {
      const pattern = (ctx: PatternContext) => ({
        fill: { fgColor: "#00FF00" }
      });

      const context: PatternContext = {
        rowIndex: 1,
        columnIndex: 0,
        value: "test",
        rowData: { col: "test" },
        allData: [{ col: "test" }],
        columnKey: "col"
      };

      const result = applyPattern(pattern, context);
      expect(result).toEqual({ fill: { fgColor: "#00FF00" } });
    });

    it("should return null for undefined pattern", () => {
      const context: PatternContext = {
        rowIndex: 1,
        columnIndex: 0,
        value: "test",
        rowData: { col: "test" },
        allData: [{ col: "test" }],
        columnKey: "col"
      };

      const result = applyPattern(undefined, context);
      expect(result).toBeNull();
    });

    it("should return null for unknown pattern name", () => {
      const context: PatternContext = {
        rowIndex: 1,
        columnIndex: 0,
        value: "test",
        rowData: { col: "test" },
        allData: [{ col: "test" }],
        columnKey: "col"
      };

      const result = applyPattern("unknown", context);
      expect(result).toBeNull();
    });
  });
});

describe("Context and Style Utilities", () => {
  describe("buildPatternContext", () => {
    it("should build context with correct row index offset", () => {
      const params = {
        rowIndex: 0,
        colIndex: 1,
        rowData: { col1: "A", col2: "B" },
        columnKey: "col2",
        value: "B",
        allData: [{ col1: "A", col2: "B" }]
      };

      const context = buildPatternContext(params);
      
      expect(context.rowIndex).toBe(2);
      expect(context.columnIndex).toBe(1);
      expect(context.value).toBe("B");
      expect(context.columnKey).toBe("col2");
      expect(context.rowData).toEqual({ col1: "A", col2: "B" });
      expect(context.allData).toEqual([{ col1: "A", col2: "B" }]);
    });

    it("should include previous row data when available", () => {
      const params = {
        rowIndex: 1,
        colIndex: 0,
        rowData: { col1: "B" },
        columnKey: "col1",
        value: "B",
        previousRowData: { col1: "A" },
        allData: [{ col1: "A" }, { col1: "B" }]
      };

      const context = buildPatternContext(params);
      expect(context.previousValue).toBe("A");
    });

    it("should handle missing previous row data", () => {
      const params = {
        rowIndex: 0,
        colIndex: 0,
        rowData: { col1: "A" },
        columnKey: "col1",
        value: "A",
        allData: [{ col1: "A" }]
      };

      const context = buildPatternContext(params);
      expect(context.previousValue).toBeUndefined();
    });
  });

  describe("resolveCellStyles", () => {
    it("should return column style when no default", () => {
      const column: ColumnDefinition = {
        key: "col1",
        style: { font: { bold: true } }
      };

      const result = resolveCellStyles({
        column,
        rowIndex: 0
      });

      expect(result).toEqual({ font: { bold: true } });
    });

    it("should merge default and column styles", () => {
      const column: ColumnDefinition = {
        key: "col1",
        style: { font: { bold: true } }
      };

      const defaultStyle: CellStyle = {
        font: { size: 12 },
        fill: { fgColor: "#EEEEEE" }
      };

      const result = resolveCellStyles({
        column,
        rowIndex: 0,
        defaultStyle
      });

      expect(result?.font?.bold).toBe(true);
      expect(result?.fill?.fgColor).toBe("#EEEEEE");
    });

    it("should override with row-specific styles", () => {
      const column: ColumnDefinition = {
        key: "col1",
        style: { font: { bold: true } },
        rows: {
          2: { font: { italic: true } }
        }
      };

      const result = resolveCellStyles({
        column,
        rowIndex: 0
      });

      expect(result).toEqual({ font: { italic: true } });
    });

    it("should handle no styles", () => {
      const column: ColumnDefinition = {
        key: "col1"
      };

      const result = resolveCellStyles({
        column,
        rowIndex: 0
      });

      expect(result).toEqual({});
    });
  });

  describe("buildCellProcessingData", () => {
    it("should create processing params for all cells", () => {
      const data: DataRow[] = [
        { col1: "A", col2: "B" },
        { col1: "C", col2: "D" }
      ];

      const columns: ColumnDefinition[] = [
        { key: "col1" },
        { key: "col2" }
      ];

      const result = buildCellProcessingData(data, columns);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        rowData: { col1: "A", col2: "B" },
        rowIndex: 0,
        column: { key: "col1" },
        columnIndex: 0,
        allData: data,
        defaultStyle: undefined
      });
    });

    it("should include default style", () => {
      const data: DataRow[] = [{ col1: "A" }];
      const columns: ColumnDefinition[] = [{ key: "col1" }];
      const defaultStyle: CellStyle = { font: { size: 12 } };

      const result = buildCellProcessingData(data, columns, defaultStyle);

      expect(result[0].defaultStyle).toEqual(defaultStyle);
    });
  });

  describe("processCellData", () => {
    it("should process cell with all parameters", () => {
      const params = {
        rowData: { col1: "A", col2: "B" },
        rowIndex: 0,
        column: {
          key: "col1",
          style: { font: { bold: true } },
          patterns: {
            bgColorPattern: "zebra"
          }
        },
        columnIndex: 0,
        allData: [{ col1: "A", col2: "B" }],
        defaultStyle: { font: { size: 11 } }
      };

      const result = processCellData(params);
      
      expect(result.rowIndex).toBe(0);
      expect(result.columnIndex).toBe(0);
      expect(result.cellStyle).toBeDefined();
      expect(result.context).toBeDefined();
      expect(result.context.rowIndex).toBe(2);
      expect(result.patterns).toBeDefined();
    });
  });
});

describe("Theme Management", () => {
  it("should apply custom theme", () => {
    const customTheme = {
      ...defaultTheme,
      primary: "#FF0000"
    };

    setTheme(customTheme);

    const context: PatternContext = {
      rowIndex: 2,
      columnIndex: 0,
      value: "new",
      previousValue: "old",
      rowData: { col: "new" },
      allData: [{ col: "old" }, { col: "new" }],
      columnKey: "col"
    };

    const result = txtColorBasedOnDiff(context);
    expect(result?.font?.color).toBe("#FF0000");

    setTheme(defaultTheme);
  });
});

describe("buildWorksheetViews", () => {
  it("should return undefined when no options provided", () => {
    const result = buildWorksheetViews({});
    expect(result).toBeUndefined();
  });

  it("should create frozen pane view", () => {
    const result = buildWorksheetViews({
      freezePane: { row: 1, column: 0 }
    });

    expect(result).toBeDefined();
    expect(result).toHaveLength(1);
    expect(result![0].state).toBe("frozen");
    expect(result![0].ySplit).toBe(1);
    expect(result![0].xSplit).toBe(0);
  });

  it("should create view with showGridLines option", () => {
    const result = buildWorksheetViews({
      showGridLines: false
    });

    expect(result).toBeDefined();
    expect(result![0].showGridLines).toBe(false);
  });

  it("should create view with showRowColHeaders option", () => {
    const result = buildWorksheetViews({
      showRowColHeaders: false
    });

    expect(result).toBeDefined();
    expect(result![0].showRowColHeaders).toBe(false);
  });

  it("should combine multiple options", () => {
    const result = buildWorksheetViews({
      freezePane: { row: 2, column: 1 },
      showGridLines: true,
      showRowColHeaders: false
    });

    expect(result).toBeDefined();
    expect(result![0].state).toBe("frozen");
    expect(result![0].ySplit).toBe(2);
    expect(result![0].xSplit).toBe(1);
    expect(result![0].showGridLines).toBe(true);
    expect(result![0].showRowColHeaders).toBe(false);
  });

  it("should handle showGridLines true explicitly", () => {
    const result = buildWorksheetViews({
      showGridLines: true
    });

    expect(result).toBeDefined();
    expect(result![0].showGridLines).toBe(true);
  });
});