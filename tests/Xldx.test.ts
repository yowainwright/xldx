import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import ExcelJS from "exceljs";
import { Xldx } from "../src/index";
import { themes } from "../src/themes";

describe("Xldx", () => {
  let testData: Record<string, any>[];

  beforeEach(() => {
    testData = [
      { id: 1, name: "John", age: 30, status: "active", amount: 1000 },
      { id: 2, name: "Jane", age: 25, status: "inactive", amount: 2000 },
      { id: 3, name: "Bob", age: 35, status: "active", amount: 1500 },
      { id: 4, name: "Alice", age: 28, status: "pending", amount: 3000 },
    ];
  });

  describe("constructor", () => {
    it("should create an instance with data", () => {
      const xlsx = new Xldx(testData);
      expect(xlsx).toBeInstanceOf(Xldx);
    });

    it("should create an instance with options", () => {
      const xlsx = new Xldx(testData, { debug: true });
      expect(xlsx).toBeInstanceOf(Xldx);
    });

    it("should handle empty data", () => {
      const xlsx = new Xldx([]);
      expect(xlsx).toBeInstanceOf(Xldx);
    });
  });

  describe("setTheme", () => {
    it("should set a theme", () => {
      const xlsx = new Xldx(testData);
      const result = xlsx.setTheme(themes.pastel);
      expect(result).toBe(xlsx);
    });

    it("should chain theme setting", () => {
      const xlsx = new Xldx(testData);
      const result = xlsx
        .setTheme(themes.dark)
        .setTheme(themes.highContrast);
      expect(result).toBe(xlsx);
    });
  });

  describe("createColumn", () => {
    it("should create a column definition", () => {
      const xlsx = new Xldx(testData);
      const column = xlsx.createColumn({
        key: "name",
        header: "Name",
        width: 20,
      });

      expect(column).toEqual({
        key: "name",
        header: "Name",
        width: 20,
      });
    });

    it("should create column with styles", () => {
      const xlsx = new Xldx(testData);
      const column = xlsx.createColumn({
        key: "amount",
        header: "Amount",
        style: {
          numFmt: "$#,##0.00",
          alignment: { horizontal: "right" },
        },
      });

      expect(column.style).toBeDefined();
      expect(column.style?.numFmt).toBe("$#,##0.00");
    });

    it("should create column with patterns", () => {
      const xlsx = new Xldx(testData);
      const column = xlsx.createColumn({
        key: "status",
        patterns: {
          bgColorPattern: "zebra",
          textPattern: "colorPerDiff",
        },
      });

      expect(column.patterns).toBeDefined();
      expect(column.patterns?.bgColorPattern).toBe("zebra");
    });

    it("should create column with row overrides", () => {
      const xlsx = new Xldx(testData);
      const column = xlsx.createColumn({
        key: "name",
        rows: {
          1: {
            font: { bold: true },
            fill: { type: "pattern", pattern: "solid", fgColor: "FF0000FF" },
          },
        },
      });

      expect(column.rows).toBeDefined();
      expect(column.rows?.[1]).toBeDefined();
      expect(column.rows?.[1].font?.bold).toBe(true);
    });
  });

  describe("createColumns", () => {
    it("should create multiple columns", () => {
      const xlsx = new Xldx(testData);
      const columns = xlsx.createColumns([
        { key: "id", header: "ID" },
        { key: "name", header: "Name" },
        { key: "age", header: "Age" },
      ]);

      expect(columns).toHaveLength(3);
      expect(columns[0].key).toBe("id");
      expect(columns[1].key).toBe("name");
      expect(columns[2].key).toBe("age");
    });
  });

  describe("createSheet", () => {
    it("should create a sheet with columns", async () => {
      const xlsx = new Xldx(testData);
      xlsx.createSheet(
        { name: "Test Sheet" },
        xlsx.createColumn({ key: "id", header: "ID" }),
        xlsx.createColumn({ key: "name", header: "Name" })
      );

      const workbook = xlsx.getWorkbook();
      expect(workbook.worksheets).toHaveLength(1);
      expect(workbook.worksheets[0].name).toBe("Test Sheet");
    });

    it("should apply freeze panes", () => {
      const xlsx = new Xldx(testData);
      xlsx.createSheet(
        { 
          name: "Frozen Sheet",
          freezePane: { row: 1, column: 2 }
        },
        xlsx.createColumn({ key: "id" }),
        xlsx.createColumn({ key: "name" })
      );

      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet.views).toBeDefined();
      expect(worksheet.views[0].state).toBe("frozen");
      expect(worksheet.views[0].xSplit).toBe(2);
      expect(worksheet.views[0].ySplit).toBe(1);
    });

    it("should apply column widths", () => {
      const xlsx = new Xldx(testData);
      xlsx.createSheet(
        { name: "Width Test" },
        xlsx.createColumn({ key: "id", width: 10 }),
        xlsx.createColumn({ key: "name", width: 30 }),
        xlsx.createColumn({ key: "age", width: "auto" })
      );

      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet.columns[0].width).toBe(10);
      expect(worksheet.columns[1].width).toBe(30);
      expect(worksheet.columns[2].width).toBeUndefined();
    });

    it("should add data rows", () => {
      const xlsx = new Xldx(testData);
      xlsx.createSheet(
        { name: "Data Test" },
        xlsx.createColumn({ key: "id" }),
        xlsx.createColumn({ key: "name" })
      );

      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet.rowCount).toBe(5); // 1 header + 4 data rows
      
      const row2 = worksheet.getRow(2);
      expect(row2.getCell(1).value).toBe(1);
      expect(row2.getCell(2).value).toBe("John");
    });

    it("should apply row height", () => {
      const xlsx = new Xldx(testData);
      xlsx.createSheet(
        { 
          name: "Height Test",
          defaultRowHeight: 25
        },
        xlsx.createColumn({ key: "id" })
      );

      const worksheet = xlsx.getWorkbook().worksheets[0];
      const dataRow = worksheet.getRow(2);
      expect(dataRow.height).toBe(25);
    });

    it("should handle empty data", () => {
      const xlsx = new Xldx([]);
      xlsx.createSheet(
        { name: "Empty Sheet" },
        xlsx.createColumn({ key: "id" }),
        xlsx.createColumn({ key: "name" })
      );

      const worksheet = xlsx.getWorkbook().worksheets[0];
      expect(worksheet.rowCount).toBe(1); // Only header row
    });
  });

  describe("createSheets", () => {
    it("should create multiple sheets", () => {
      const xlsx = new Xldx(testData);
      xlsx.createSheets([
        {
          options: { name: "Sheet1" },
          columns: [
            xlsx.createColumn({ key: "id" }),
            xlsx.createColumn({ key: "name" }),
          ],
        },
        {
          options: { name: "Sheet2" },
          columns: [
            xlsx.createColumn({ key: "age" }),
            xlsx.createColumn({ key: "status" }),
          ],
        },
      ]);

      const workbook = xlsx.getWorkbook();
      expect(workbook.worksheets).toHaveLength(2);
      expect(workbook.worksheets[0].name).toBe("Sheet1");
      expect(workbook.worksheets[1].name).toBe("Sheet2");
    });
  });

  describe("output methods", () => {
    it("should generate buffer", async () => {
      const xlsx = new Xldx(testData);
      xlsx.createSheet(
        { name: "Buffer Test" },
        xlsx.createColumn({ key: "id" })
      );

      const buffer = await xlsx.toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should generate Uint8Array", async () => {
      const xlsx = new Xldx(testData);
      xlsx.createSheet(
        { name: "Uint8Array Test" },
        xlsx.createColumn({ key: "id" })
      );

      const uint8Array = await xlsx.toUint8Array();
      expect(uint8Array).toBeInstanceOf(Uint8Array);
      expect(uint8Array.length).toBeGreaterThan(0);
    });

    it("should return workbook", () => {
      const xlsx = new Xldx(testData);
      const workbook = xlsx.getWorkbook();
      expect(workbook).toBeInstanceOf(ExcelJS.Workbook);
    });
  });

  describe("method chaining", () => {
    it("should support method chaining", async () => {
      const xlsx = new Xldx(testData);
      
      const result = await xlsx
        .setTheme(themes.pastel)
        .createSheet(
          { name: "Sheet1" },
          xlsx.createColumn({ key: "id" })
        )
        .createSheet(
          { name: "Sheet2" },
          xlsx.createColumn({ key: "name" })
        )
        .toBuffer();

      expect(result).toBeInstanceOf(Buffer);
      
      const workbook = xlsx.getWorkbook();
      expect(workbook.worksheets).toHaveLength(2);
    });
  });
});