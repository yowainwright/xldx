import { describe, it, expect } from "bun:test";
import { Xldx } from "../src/server";
import {
  zebraBg,
  bgColorBasedOnDiff,
  txtColorBasedOnDiff,
  createSetWidthBasedOnCharacterCount,
  applyPattern,
  buildPatternContext
} from "../src/utils";
import { defaultTheme } from "../src/themes";
import type { PatternContext, DataRow, ColorTheme } from "../src";

describe("index", () => {
  describe("getSheetData", () => {
    it("should get rows data from a sheet", () => {
      const data = [
        { name: "Alice", age: 30, city: "NYC" },
        { name: "Bob", age: 25, city: "LA" },
        { name: "Charlie", age: 35, city: "Chicago" }
      ];

      const xldx = new Xldx(data);
      xldx.createSheet(
        { name: "People" },
        { key: "name", header: "Name" },
        { key: "age", header: "Age" },
        { key: "city", header: "City" }
      );

      const sheetData = xldx.getSheetData("People");
      const rows = sheetData.getRowsData();

      expect(rows).toEqual(data);
    });

    it("should get column data from a sheet", () => {
      const data = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
        { name: "Charlie", age: 35 }
      ];

      const xldx = new Xldx(data);
      xldx.createSheet(
        { name: "People" },
        { key: "name", header: "Name" },
        { key: "age", header: "Age" }
      );

      const sheetData = xldx.getSheetData("People");
      const columnData = sheetData.getColumnData();

      expect(columnData).toEqual({
        name: ["Alice", "Bob", "Charlie"],
        age: [30, 25, 35]
      });
    });

    it("should get sheet data by index", () => {
      const data1 = [{ a: 1 }, { a: 2 }];
      const data2 = [{ b: 3 }, { b: 4 }];

      const xldx = new Xldx(data1);
      xldx.createSheet({ name: "Sheet1" }, { key: "a", header: "A" });
      
      const xldx2 = new Xldx(data2);
      xldx2.createSheet({ name: "Sheet2" }, { key: "b", header: "B" });

      const sheet1Data = xldx.getSheetData(0);
      expect(sheet1Data.getRowsData()).toEqual(data1);

      const sheet2Data = xldx2.getSheetData(0);
      expect(sheet2Data.getRowsData()).toEqual(data2);
    });

    it("should update row data", () => {
      const data = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 }
      ];

      const xldx = new Xldx(data);
      xldx.createSheet(
        { name: "People" },
        { key: "name", header: "Name" },
        { key: "age", header: "Age" }
      );

      const sheetData = xldx.getSheetData("People");
      sheetData.updateRowData(0, { age: 31 });

      const updatedRows = sheetData.getRowsData();
      expect(updatedRows[0].age).toBe(31);
      expect(updatedRows[0].name).toBe("Alice");
    });

    it("should update column data", () => {
      const data = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
        { name: "Charlie", age: 35 }
      ];

      const xldx = new Xldx(data);
      xldx.createSheet(
        { name: "People" },
        { key: "name", header: "Name" },
        { key: "age", header: "Age" }
      );

      const sheetData = xldx.getSheetData("People");
      sheetData.updateColumnData("age", [31, 26, 36]);

      const updatedColumns = sheetData.getColumnData();
      expect(updatedColumns.age).toEqual([31, 26, 36]);
    });

    it("should throw error for non-existent sheet", () => {
      const xldx = new Xldx([]);
      xldx.createSheet({ name: "Sheet1" }, { key: "a", header: "A" });

      expect(() => xldx.getSheetData("NonExistent")).toThrow("Sheet NonExistent not found");
      expect(() => xldx.getSheetData(5)).toThrow("Sheet at index 5 not found");
    });

    it("should handle multiple sheets independently", () => {
      const xldx = new Xldx([{ a: 1, b: 2 }]);
      xldx.createSheet(
        { name: "Sheet1" },
        { key: "a", header: "A" },
        { key: "b", header: "B" }
      );

      const sheet1 = xldx.getSheetData("Sheet1");
      sheet1.updateRowData(0, { b: 20 });

      expect(sheet1.getRowsData()[0]).toEqual({ a: 1, b: 20 });
    });
  });

  describe("Pattern Functions", () => {
    it("should apply zebra background to even rows", () => {
      const context: PatternContext = {
        rowIndex: 2,
        columnIndex: 0,
        value: 'test',
        rowData: { col1: 'test' },
        allData: [{ col1: 'test' }],
        columnKey: 'col1'
      };
      
      const result = zebraBg(context);
      expect(result).toEqual({
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: defaultTheme.base[100]
        }
      });
    });

    it("should return null for odd zebra rows", () => {
      const context: PatternContext = {
        rowIndex: 3,
        columnIndex: 0,
        value: 'test',
        rowData: { col1: 'test' },
        allData: [{ col1: 'test' }],
        columnKey: 'col1'
      };
      
      const result = zebraBg(context);
      expect(result).toBeNull();
    });

    it("should assign different colors to different values", () => {
      const allData: DataRow[] = [
        { category: 'A' },
        { category: 'B' },
        { category: 'A' },
        { category: 'C' }
      ];

      const contextA: PatternContext = {
        rowIndex: 1,
        columnIndex: 0,
        value: 'A',
        rowData: { category: 'A' },
        allData,
        columnKey: 'category'
      };

      const contextB: PatternContext = {
        rowIndex: 2,
        columnIndex: 0,
        value: 'B',
        rowData: { category: 'B' },
        allData,
        columnKey: 'category'
      };

      const resultA = bgColorBasedOnDiff(contextA);
      const resultB = bgColorBasedOnDiff(contextB);

      expect(resultA?.fill?.fgColor).toBeDefined();
      expect(resultB?.fill?.fgColor).toBeDefined();
      expect(resultA?.fill?.fgColor).not.toEqual(resultB?.fill?.fgColor);
    });

    it("should highlight changed text values", () => {
      const context: PatternContext = {
        rowIndex: 2,
        columnIndex: 0,
        value: 'new',
        previousValue: 'old',
        rowData: { col1: 'new' },
        allData: [{ col1: 'old' }, { col1: 'new' }],
        columnKey: 'col1'
      };

      const result = txtColorBasedOnDiff(context);
      expect(result).toEqual({
        font: {
          color: defaultTheme.primary,
          bold: true
        }
      });
    });

    it("should calculate column width from data", () => {
      const columnData = ['short', 'medium text', 'long text with more characters'];
      const calculator = createSetWidthBasedOnCharacterCount(columnData);
      const result = calculator();

      expect(result).toBeDefined();
      expect(result?.width).toBeGreaterThan(10);
      expect(result?.wrapText).toBe(true);
    });

    it("should apply patterns when creating sheets", async () => {
      const data = [
        { name: 'Alice', score: 95 },
        { name: 'Bob', score: 87 },
        { name: 'Charlie', score: 95 }
      ];

      const xldx = new Xldx(data);
      
      xldx.createSheet(
        { name: 'Scores' },
        {
          key: 'name',
          header: 'Name',
          patterns: {
            bgColorPattern: 'zebra'
          }
        },
        {
          key: 'score',
          header: 'Score',
          patterns: {
            bgColorPattern: 'colorPerDiff'
          }
        }
      );

      const sheetData = xldx.getSheetData(0);
      const rows = sheetData.getRowsData();
      
      expect(rows).toHaveLength(3);
      expect(rows[0]).toEqual({ name: 'Alice', score: 95 });
    });

    it("should apply pattern by name or function", () => {
      const context: PatternContext = {
        rowIndex: 2,
        columnIndex: 0,
        value: 'test',
        rowData: { col1: 'test' },
        allData: [{ col1: 'test' }],
        columnKey: 'col1'
      };

      const result = applyPattern('zebra', context);
      expect(result).toBeDefined();

      const customPattern = (ctx: PatternContext) => ({
        font: { color: '#FF0000' }
      });

      const customResult = applyPattern(customPattern, context);
      expect(customResult).toEqual({ font: { color: '#FF0000' } });
    });

    it("should build pattern context with proper offsets", () => {
      const params = {
        rowIndex: 0,
        colIndex: 1,
        rowData: { col1: 'A', col2: 'B' },
        columnKey: 'col2',
        value: 'B',
        allData: [{ col1: 'A', col2: 'B' }]
      };

      const context = buildPatternContext(params);
      expect(context.rowIndex).toBe(2);
      expect(context.columnIndex).toBe(1);
      expect(context.value).toBe('B');
      expect(context.columnKey).toBe('col2');
    });
  });

  describe("Xldx class methods", () => {
    describe("setTheme", () => {
      it("should set a custom theme and return this for chaining", () => {
        const customTheme: ColorTheme = {
          ...defaultTheme,
          primary: "#FF0000"
        };

        const xldx = new Xldx([{ a: 1 }]);
        const result = xldx.setTheme(customTheme);

        expect(result).toBe(xldx);
      });
    });

    describe("createColumn", () => {
      it("should return the column definition unchanged", () => {
        const xldx = new Xldx([]);
        const definition = { key: "test", header: "Test Header", width: 100 };

        const result = xldx.createColumn(definition);
        expect(result).toEqual(definition);
      });
    });

    describe("createColumns", () => {
      it("should return the column definitions unchanged", () => {
        const xldx = new Xldx([]);
        const definitions = [
          { key: "col1", header: "Column 1" },
          { key: "col2", header: "Column 2" }
        ];

        const result = xldx.createColumns(definitions);
        expect(result).toEqual(definitions);
      });
    });

    describe("createSheets", () => {
      it("should create multiple sheets at once", () => {
        const data = [
          { name: "Alice", age: 30 },
          { name: "Bob", age: 25 }
        ];

        const xldx = new Xldx(data);
        xldx.createSheets([
          {
            options: { name: "Sheet1" },
            columns: [{ key: "name", header: "Name" }]
          },
          {
            options: { name: "Sheet2" },
            columns: [{ key: "age", header: "Age" }]
          }
        ]);

        const sheet1 = xldx.getSheetData("Sheet1");
        const sheet2 = xldx.getSheetData("Sheet2");

        expect(sheet1.getRowsData()).toEqual(data);
        expect(sheet2.getRowsData()).toEqual(data);
      });
    });

    describe("toJSON", () => {
      it("should export workbook as JSON", () => {
        const data = [
          { name: "Alice", score: 95 },
          { name: "Bob", score: 87 }
        ];

        const xldx = new Xldx(data);
        xldx.createSheet(
          { name: "Scores" },
          { key: "name", header: "Name" },
          { key: "score", header: "Score" }
        );

        const json = xldx.toJSON();

        expect(json.sheets).toHaveLength(1);
        expect(json.sheets[0].name).toBe("Scores");
        expect(json.sheets[0].data).toBeDefined();
      });

      it("should export multiple sheets", () => {
        const xldx = new Xldx([{ a: 1 }]);
        xldx.createSheet({ name: "Sheet1" }, { key: "a" });

        const xldx2 = new Xldx([{ b: 2 }]);
        xldx2.createSheet({ name: "Sheet2" }, { key: "b" });

        const json1 = xldx.toJSON();
        const json2 = xldx2.toJSON();

        expect(json1.sheets).toHaveLength(1);
        expect(json2.sheets).toHaveLength(1);
      });
    });

    describe("fromJSON", () => {
      it("should create Xldx instance from JSON", () => {
        const json = {
          sheets: [
            {
              name: "TestSheet",
              data: [["Header"], ["Value"]],
              columnWidths: [20]
            }
          ]
        };

        const xldx = Xldx.fromJSON(json);
        expect(xldx).toBeInstanceOf(Xldx);
      });

      it("should handle empty sheets array", () => {
        const json = { sheets: [] };
        const xldx = Xldx.fromJSON(json);
        expect(xldx).toBeInstanceOf(Xldx);
      });

      it("should handle missing sheets property", () => {
        const json = {};
        const xldx = Xldx.fromJSON(json);
        expect(xldx).toBeInstanceOf(Xldx);
      });
    });

    describe("read", () => {
      it("should read XLSX data from Uint8Array", async () => {
        const data = [
          { name: "Alice", age: 30 },
          { name: "Bob", age: 25 }
        ];

        const xldx = new Xldx(data);
        xldx.createSheet(
          { name: "People" },
          { key: "name", header: "Name" },
          { key: "age", header: "Age" }
        );

        const uint8Array = await xldx.toUint8Array();
        const result = await Xldx.read(uint8Array);

        expect(result.sheets).toHaveLength(1);
        expect(result.sheets[0].name).toBe("People");
        expect(result.sheets[0].data[0]).toEqual(["Name", "Age"]);
      });

      it("should read XLSX data from Buffer", async () => {
        const data = [{ value: "test" }];
        const xldx = new Xldx(data);
        xldx.createSheet({ name: "Test" }, { key: "value" });

        const uint8Array = await xldx.toUint8Array();
        const buffer = Buffer.from(uint8Array);
        const result = await Xldx.read(buffer);

        expect(result.sheets).toHaveLength(1);
      });
    });

    describe("toUint8Array", () => {
      it("should generate valid XLSX as Uint8Array", async () => {
        const xldx = new Xldx([{ a: 1, b: 2 }]);
        xldx.createSheet({ name: "Test" }, { key: "a" }, { key: "b" });

        const result = await xldx.toUint8Array();

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
        // ZIP signature
        expect(result[0]).toBe(0x50);
        expect(result[1]).toBe(0x4b);
      });
    });

    describe("Server methods", () => {
      it("should generate valid Buffer with toBuffer", async () => {
        const xldx = new Xldx([{ a: 1 }]);
        xldx.createSheet({ name: "Test" }, { key: "a" });

        const buffer = await xldx.toBuffer();

        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
        expect(buffer[0]).toBe(0x50);
        expect(buffer[1]).toBe(0x4b);
      });

      it("should write file to disk with write method", async () => {
        const fs = await import("fs/promises");
        const path = await import("path");
        const os = await import("os");

        const xldx = new Xldx([{ value: "test" }]);
        xldx.createSheet({ name: "WriteTest" }, { key: "value" });

        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "xldx-test-"));
        const filePath = path.join(tempDir, "write-test.xlsx");

        await xldx.write(filePath);

        const stats = await fs.stat(filePath);
        expect(stats.size).toBeGreaterThan(0);

        await fs.rm(tempDir, { recursive: true, force: true });
      });

      it("should write file using download alias", async () => {
        const fs = await import("fs/promises");
        const path = await import("path");
        const os = await import("os");

        const xldx = new Xldx([{ item: "download" }]);
        xldx.createSheet({ name: "Download" }, { key: "item" });

        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "xldx-download-"));
        const filePath = path.join(tempDir, "download.xlsx");

        await xldx.download(filePath);

        const stats = await fs.stat(filePath);
        expect(stats.size).toBeGreaterThan(0);

        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });

    describe("Multi-sheet data (SheetsData)", () => {
      it("should build sheets from SheetsData structure", () => {
        const sheetsData = {
          sheets: [
            {
              name: "Sheet1",
              data: {
                col1: ["A", "B", "C"],
                col2: [1, 2, 3]
              }
            },
            {
              name: "Sheet2",
              data: {
                x: ["X", "Y"],
                y: [10, 20]
              }
            }
          ]
        };

        const xldx = new Xldx(sheetsData);

        const sheet1 = xldx.getSheetData("Sheet1");
        const sheet2 = xldx.getSheetData("Sheet2");

        expect(sheet1.getRowsData()).toHaveLength(3);
        expect(sheet2.getRowsData()).toHaveLength(2);
      });

      it("should convert column data to rows correctly", () => {
        const sheetsData = {
          sheets: [
            {
              name: "Test",
              data: {
                name: ["Alice", "Bob"],
                age: [30, 25]
              }
            }
          ]
        };

        const xldx = new Xldx(sheetsData);
        const sheet = xldx.getSheetData("Test");
        const rows = sheet.getRowsData();

        expect(rows[0]).toEqual({ name: "Alice", age: 30 });
        expect(rows[1]).toEqual({ name: "Bob", age: 25 });
      });

      it("should handle empty column data", () => {
        const sheetsData = {
          sheets: [
            {
              name: "Empty",
              data: {}
            }
          ]
        };

        const xldx = new Xldx(sheetsData);
        const sheet = xldx.getSheetData("Empty");
        expect(sheet.getRowsData()).toHaveLength(0);
      });

      it("should handle columns with different lengths", () => {
        const sheetsData = {
          sheets: [
            {
              name: "Uneven",
              data: {
                short: ["A"],
                long: ["X", "Y", "Z"]
              }
            }
          ]
        };

        const xldx = new Xldx(sheetsData);
        const sheet = xldx.getSheetData("Uneven");
        const rows = sheet.getRowsData();

        expect(rows).toHaveLength(3);
        expect(rows[0].short).toBe("A");
        expect(rows[1].short).toBeNull();
        expect(rows[2].short).toBeNull();
      });
    });
  });
});