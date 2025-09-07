import { describe, it, expect, beforeEach, mock } from "bun:test";
import ExcelJS from "exceljs";
import { Xldx } from "../src/index";
import { themes } from "../src/themes";
import type { PatternFunction } from "../src/schemas";

describe("Xldx", () => {
  let testData: Record<string, any>[];
  let xlsx: Xldx;

  beforeEach(() => {
    testData = [
      { id: 1, name: "John", age: 30, status: "active" },
      { id: 2, name: "Jane", age: 25, status: "inactive" },
      { id: 3, name: "Bob", age: 35, status: "active" },
    ];
    xlsx = new Xldx(testData);
  });

  describe("constructor", () => {
    it("should initialize workbook", () => {
      const workbook = xlsx.getWorkbook();
      expect(workbook).toBeInstanceOf(ExcelJS.Workbook);
      expect(workbook.creator).toBe("Xldx");
    });

    it("should store data", () => {
      const xlsx = new Xldx(testData);
      expect(xlsx).toBeInstanceOf(Xldx);
    });

    it("should accept options", () => {
      const customPattern: PatternFunction = mock(() => null);
      const xlsxWithOptions = new Xldx(testData, {
        customPatterns: { test: customPattern },
      });
      expect(xlsxWithOptions).toBeInstanceOf(Xldx);
    });
  });

  describe("setTheme", () => {
    it("should return this for chaining", () => {
      const result = xlsx.setTheme(themes.pastel);
      expect(result).toBe(xlsx);
    });

    it("should accept any theme", () => {
      expect(() => xlsx.setTheme(themes.dark)).not.toThrow();
      expect(() => xlsx.setTheme(themes.highContrast)).not.toThrow();
    });
  });

  describe("createColumn", () => {
    it("should return column definition unchanged", () => {
      const columnDef = {
        key: "test",
        header: "Test",
        width: 20,
      };
      const result = xlsx.createColumn(columnDef);
      expect(result).toBe(columnDef);
    });
  });

  describe("createColumns", () => {
    it("should return array of column definitions unchanged", () => {
      const columnDefs = [
        { key: "col1" },
        { key: "col2" },
      ];
      const result = xlsx.createColumns(columnDefs);
      expect(result).toBe(columnDefs);
    });
  });

  describe("applyPatternStyles", () => {
    it("should handle undefined patterns", () => {
      xlsx.createSheet(
        { name: "Test" },
        { key: "id", patterns: undefined }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet).toBeDefined();
    });

    it("should apply built-in pattern by name", () => {
      xlsx.createSheet(
        { name: "Test" },
        { key: "id", patterns: { bgColorPattern: "zebra" } }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet.rowCount).toBeGreaterThan(0);
    });

    it("should apply custom pattern by name", () => {
      const customFn: PatternFunction = mock(() => null);
      const xlsxWithCustom = new Xldx(testData, {
        customPatterns: { myPattern: customFn },
      });
      
      xlsxWithCustom.createSheet(
        { name: "Test" },
        { key: "id", patterns: { bgColorPattern: "myPattern" } }
      );
      
      expect(customFn).toHaveBeenCalled();
    });

    it("should apply function pattern directly", () => {
      const patternFn: PatternFunction = mock(() => null);
      xlsx.createSheet(
        { name: "Test" },
        { key: "id", patterns: { bgColorPattern: patternFn } }
      );
      expect(patternFn).toHaveBeenCalled();
    });

    it("should apply multiple custom patterns", () => {
      const pattern1: PatternFunction = mock(() => null);
      const pattern2: PatternFunction = mock(() => null);
      
      xlsx.createSheet(
        { name: "Test" },
        { key: "id", patterns: { custom: [pattern1, pattern2] } }
      );
      
      expect(pattern1).toHaveBeenCalled();
      expect(pattern2).toHaveBeenCalled();
    });
  });

  describe("applyCellStyle", () => {
    it("should apply font styles", () => {
      xlsx.createSheet(
        { name: "Test" },
        {
          key: "id",
          style: {
            font: { bold: true, size: 14, color: "FF0000FF" },
          },
        }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      const cell = worksheet.getRow(2).getCell(1);
      expect(cell.font).toBeDefined();
    });

    it("should apply fill styles", () => {
      xlsx.createSheet(
        { name: "Test" },
        {
          key: "id",
          style: {
            fill: { type: "pattern", pattern: "solid", fgColor: "FF0000FF" },
          },
        }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet).toBeDefined();
    });

    it("should apply number format", () => {
      xlsx.createSheet(
        { name: "Test" },
        {
          key: "age",
          style: { numFmt: "0.00" },
        }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      const cell = worksheet.getRow(2).getCell(1);
      expect(cell.numFmt).toBe("0.00");
    });
  });

  describe("createSheet", () => {
    it("should create worksheet with name", () => {
      xlsx.createSheet({ name: "TestSheet" }, { key: "id" });
      const worksheet = xlsx.getWorkbook().getWorksheet("TestSheet");
      expect(worksheet).toBeDefined();
      expect(worksheet?.name).toBe("TestSheet");
    });

    it("should return this for chaining", () => {
      const result = xlsx.createSheet({ name: "Test" }, { key: "id" });
      expect(result).toBe(xlsx);
    });

    it("should set column headers", () => {
      xlsx.createSheet(
        { name: "Test" },
        { key: "id", header: "ID" },
        { key: "name", header: "Name" }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet.getRow(1).getCell(1).value).toBe("ID");
      expect(worksheet.getRow(1).getCell(2).value).toBe("Name");
    });

    it("should use key as header if header not provided", () => {
      xlsx.createSheet(
        { name: "Test" },
        { key: "id" }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet.getRow(1).getCell(1).value).toBe("id");
    });

    it("should set column widths", () => {
      xlsx.createSheet(
        { name: "Test" },
        { key: "id", width: 10 },
        { key: "name", width: 25 }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet.columns[0].width).toBe(10);
      expect(worksheet.columns[1].width).toBe(25);
    });

    it("should handle auto width", () => {
      xlsx.createSheet(
        { name: "Test" },
        { key: "id", width: "auto" }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet.columns[0].width).toBeUndefined();
    });

    it("should apply freeze panes", () => {
      xlsx.createSheet(
        { name: "Test", freezePane: { row: 2, column: 1 } },
        { key: "id" }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet.views[0].state).toBe("frozen");
      expect(worksheet.views[0].xSplit).toBe(1);
      expect(worksheet.views[0].ySplit).toBe(2);
    });

    it("should set grid lines visibility", () => {
      xlsx.createSheet(
        { name: "Test", showGridLines: false },
        { key: "id" }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet.views[0].showGridLines).toBe(false);
    });

    it("should set row/column headers visibility", () => {
      xlsx.createSheet(
        { name: "Test", showRowColHeaders: false },
        { key: "id" }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet.views[0].showRowColHeaders).toBe(false);
    });

    it("should add data rows", () => {
      xlsx.createSheet(
        { name: "Test" },
        { key: "id" },
        { key: "name" }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet.rowCount).toBe(4); // 1 header + 3 data
      expect(worksheet.getRow(2).getCell(1).value).toBe(1);
      expect(worksheet.getRow(2).getCell(2).value).toBe("John");
    });

    it("should apply default row height", () => {
      xlsx.createSheet(
        { name: "Test", defaultRowHeight: 30 },
        { key: "id" }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet.getRow(2).height).toBe(30);
    });

    it("should apply row overrides", () => {
      xlsx.createSheet(
        { name: "Test" },
        {
          key: "id",
          rows: {
            2: { font: { bold: true } },
          },
        }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet).toBeDefined();
    });

    it("should apply header row overrides", () => {
      xlsx.createSheet(
        { name: "Test" },
        {
          key: "id",
          rows: {
            1: {
              font: { bold: true, color: "FFFFFFFF" },
              fill: { type: "pattern", pattern: "solid", fgColor: "FF0000FF" },
            },
          },
        }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      const headerCell = worksheet.getRow(1).getCell(1);
      expect(headerCell).toBeDefined();
    });

    it("should apply default styles", () => {
      xlsx.createSheet(
        {
          name: "Test",
          defaultStyle: {
            font: { name: "Arial", size: 12 },
          },
        },
        { key: "id" }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet).toBeDefined();
    });

    it("should apply column styles", () => {
      xlsx.createSheet(
        { name: "Test" },
        {
          key: "id",
          style: {
            alignment: { horizontal: "center" },
          },
        }
      );
      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet).toBeDefined();
    });

    it("should create pattern context correctly", () => {
      const patternFn: PatternFunction = mock(() => null);
      xlsx.createSheet(
        { name: "Test" },
        { key: "name", patterns: { bgColorPattern: patternFn } }
      );
      
      expect(patternFn).toHaveBeenCalledWith(
        expect.objectContaining({
          rowIndex: 2,
          columnIndex: 0,
          value: "John",
          previousValue: undefined,
          columnKey: "name",
        })
      );
    });

    it("should pass previous value in context", () => {
      const patternFn: PatternFunction = mock(() => null);
      xlsx.createSheet(
        { name: "Test" },
        { key: "name", patterns: { bgColorPattern: patternFn } }
      );
      
      const calls = patternFn.mock.calls;
      const secondRowCall = calls.find(call => call[0].rowIndex === 3);
      expect(secondRowCall[0].previousValue).toBe("John");
    });
  });

  describe("createSheets", () => {
    it("should create multiple sheets", () => {
      xlsx.createSheets([
        {
          options: { name: "Sheet1" },
          columns: [{ key: "id" }],
        },
        {
          options: { name: "Sheet2" },
          columns: [{ key: "name" }],
        },
      ]);
      
      const workbook = xlsx.getWorkbook();
      expect(workbook.worksheets).toHaveLength(2);
      expect(workbook.worksheets[0].name).toBe("Sheet1");
      expect(workbook.worksheets[1].name).toBe("Sheet2");
    });

    it("should return this for chaining", () => {
      const result = xlsx.createSheets([]);
      expect(result).toBe(xlsx);
    });
  });

  describe("output methods", () => {
    beforeEach(() => {
      xlsx.createSheet({ name: "Test" }, { key: "id" });
    });

    it("should generate buffer", async () => {
      const buffer = await xlsx.toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should generate Uint8Array", async () => {
      const uint8Array = await xlsx.toUint8Array();
      expect(uint8Array).toBeInstanceOf(Uint8Array);
      expect(uint8Array.length).toBeGreaterThan(0);
    });

    it("should return workbook instance", () => {
      const workbook = xlsx.getWorkbook();
      expect(workbook).toBeInstanceOf(ExcelJS.Workbook);
      expect(workbook).toBe(xlsx.getWorkbook());
    });
  });

});