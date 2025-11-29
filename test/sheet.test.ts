import { describe, it, expect } from "bun:test";
import { Sheet } from "../src/sheet";
import type { ColumnDefinition, SheetOptions, DataRow } from "../src";

describe("Sheet", () => {
  describe("constructor and initialization", () => {
    it("should create a sheet with data and columns", () => {
      const data: DataRow[] = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 }
      ];
      
      const columns: ColumnDefinition[] = [
        { key: "name", header: "Name" },
        { key: "age", header: "Age" }
      ];
      
      const options: SheetOptions = { name: "TestSheet" };
      
      const sheet = new Sheet(data, columns, options);
      expect(sheet).toBeDefined();
      expect(sheet.getRowsData()).toEqual(data);
    });
  });

  describe("getRowsData", () => {
    it("should return a copy of the data", () => {
      const data: DataRow[] = [{ id: 1 }, { id: 2 }];
      const columns: ColumnDefinition[] = [{ key: "id", header: "ID" }];
      const sheet = new Sheet(data, columns, { name: "Test" });
      
      const rowsData = sheet.getRowsData();
      expect(rowsData).toEqual(data);
      expect(rowsData).not.toBe(data);
    });
  });

  describe("getColumnData", () => {
    it("should return data organized by columns", () => {
      const data: DataRow[] = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
        { name: "Charlie", age: 35 }
      ];
      
      const columns: ColumnDefinition[] = [
        { key: "name", header: "Name" },
        { key: "age", header: "Age" }
      ];
      
      const sheet = new Sheet(data, columns, { name: "Test" });
      const columnData = sheet.getColumnData();
      
      expect(columnData).toEqual({
        name: ["Alice", "Bob", "Charlie"],
        age: [30, 25, 35]
      });
    });

    it("should return empty object for empty data", () => {
      const sheet = new Sheet([], [], { name: "Empty" });
      expect(sheet.getColumnData()).toEqual({});
    });
  });

  describe("getColData", () => {
    it("should get column data by key", () => {
      const data: DataRow[] = [
        { name: "Alice", score: 95 },
        { name: "Bob", score: 87 }
      ];
      
      const columns: ColumnDefinition[] = [
        { key: "name", header: "Name" },
        { key: "score", header: "Score" }
      ];
      
      const sheet = new Sheet(data, columns, { name: "Test" });
      const colData = sheet.getColData("score");
      
      expect(colData.data).toEqual([95, 87]);
    });

    it("should get column data by index", () => {
      const data: DataRow[] = [
        { name: "Alice", score: 95 },
        { name: "Bob", score: 87 }
      ];
      
      const columns: ColumnDefinition[] = [
        { key: "name", header: "Name" },
        { key: "score", header: "Score" }
      ];
      
      const sheet = new Sheet(data, columns, { name: "Test" });
      const colData = sheet.getColData(1);
      
      expect(colData.data).toEqual([95, 87]);
    });

    it("should throw error for invalid column", () => {
      const sheet = new Sheet([{ a: 1 }], [{ key: "a" }], { name: "Test" });
      
      expect(() => sheet.getColData("invalid")).toThrow("Column invalid not found");
      expect(() => sheet.getColData(5)).toThrow("Column 5 not found");
    });
  });

  describe("getRowData", () => {
    it("should get row data by index", () => {
      const data: DataRow[] = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 }
      ];
      
      const columns: ColumnDefinition[] = [
        { key: "name", header: "Name" },
        { key: "age", header: "Age" }
      ];
      
      const sheet = new Sheet(data, columns, { name: "Test" });
      const rowData = sheet.getRowData(1);
      
      expect(rowData.data).toEqual({ name: "Bob", age: 25 });
    });

    it("should throw error for invalid row index", () => {
      const sheet = new Sheet([{ a: 1 }], [{ key: "a" }], { name: "Test" });
      
      expect(() => sheet.getRowData(-1)).toThrow("Row -1 not found");
      expect(() => sheet.getRowData(10)).toThrow("Row 10 not found");
    });
  });

  describe("updateRowData", () => {
    it("should update row data", () => {
      const data: DataRow[] = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 }
      ];
      
      const columns: ColumnDefinition[] = [
        { key: "name", header: "Name" },
        { key: "age", header: "Age" }
      ];
      
      const sheet = new Sheet(data, columns, { name: "Test" });
      sheet.updateRowData(0, { age: 31 });
      
      const updatedData = sheet.getRowsData();
      expect(updatedData[0]).toEqual({ name: "Alice", age: 31 });
    });

    it("should not update invalid row index", () => {
      const data: DataRow[] = [{ id: 1 }];
      const sheet = new Sheet(data, [{ key: "id" }], { name: "Test" });
      
      sheet.updateRowData(10, { id: 2 });
      expect(sheet.getRowsData()).toEqual([{ id: 1 }]);
    });
  });

  describe("updateColumnData", () => {
    it("should update column data", () => {
      const data: DataRow[] = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
        { name: "Charlie", age: 35 }
      ];
      
      const columns: ColumnDefinition[] = [
        { key: "name", header: "Name" },
        { key: "age", header: "Age" }
      ];
      
      const sheet = new Sheet(data, columns, { name: "Test" });
      sheet.updateColumnData("age", [31, 26, 36]);
      
      const columnData = sheet.getColumnData();
      expect(columnData.age).toEqual([31, 26, 36]);
    });

    it("should ignore invalid column key", () => {
      const data: DataRow[] = [{ id: 1 }];
      const sheet = new Sheet(data, [{ key: "id" }], { name: "Test" });
      
      sheet.updateColumnData("invalid", [2]);
      expect(sheet.getRowsData()).toEqual([{ id: 1 }]);
    });

    it("should only update valid row indices", () => {
      const data: DataRow[] = [{ id: 1 }, { id: 2 }];
      const sheet = new Sheet(data, [{ key: "id" }], { name: "Test" });
      
      sheet.updateColumnData("id", [10, 20, 30, 40]);
      expect(sheet.getRowsData()).toEqual([{ id: 10 }, { id: 20 }]);
    });
  });

  describe("getRowStyles", () => {
    it("should return empty object when no index provided", () => {
      const sheet = new Sheet([{ a: 1 }], [{ key: "a" }], { name: "Test" });
      expect(sheet.getRowStyles()).toEqual({});
    });

    it("should return styles for specific row", () => {
      const columns: ColumnDefinition[] = [{
        key: "a",
        style: { font: { bold: true } }
      }];
      
      const sheet = new Sheet([{ a: 1 }], columns, { 
        name: "Test",
        defaultStyle: { font: { size: 12 } }
      });
      
      const styles = sheet.getRowStyles(0);
      expect(styles).toHaveProperty("font");
    });
  });

  describe("getColumnStyles", () => {
    it("should return empty object when no key provided", () => {
      const sheet = new Sheet([{ a: 1 }], [{ key: "a" }], { name: "Test" });
      expect(sheet.getColumnStyles()).toEqual({});
    });

    it("should return column styles", () => {
      const columns: ColumnDefinition[] = [{
        key: "a",
        style: { font: { bold: true } }
      }];
      
      const sheet = new Sheet([{ a: 1 }], columns, { name: "Test" });
      const styles = sheet.getColumnStyles("a");
      
      expect(styles).toEqual({ font: { bold: true } });
    });

    it("should return empty object for invalid column", () => {
      const sheet = new Sheet([{ a: 1 }], [{ key: "a" }], { name: "Test" });
      expect(sheet.getColumnStyles("invalid")).toEqual({});
    });
  });

  describe("updateRowStyles", () => {
    it("should update row styles", () => {
      const columns: ColumnDefinition[] = [
        { key: "a" },
        { key: "b" }
      ];
      
      const sheet = new Sheet([{ a: 1, b: 2 }], columns, { name: "Test" });
      sheet.updateRowStyles(0, { font: { italic: true } });
      
      const styles = sheet.getRowStyles(0);
      expect(styles).toBeDefined();
    });

    it("should not update invalid row index", () => {
      const sheet = new Sheet([{ a: 1 }], [{ key: "a" }], { name: "Test" });
      sheet.updateRowStyles(10, { font: { bold: true } });
    });
  });

  describe("updateColumnStyles", () => {
    it("should update column styles", () => {
      const columns: ColumnDefinition[] = [{
        key: "a",
        style: { fill: { fgColor: "#FF0000" } }
      }];
      
      const sheet = new Sheet([{ a: 1 }], columns, { name: "Test" });
      sheet.updateColumnStyles("a", { font: { bold: true } });
      
      const styles = sheet.getColumnStyles("a");
      expect(styles).toEqual({ 
        fill: { fgColor: "#FF0000" },
        font: { bold: true } 
      });
    });

    it("should not update invalid column", () => {
      const sheet = new Sheet([{ a: 1 }], [{ key: "a" }], { name: "Test" });
      sheet.updateColumnStyles("invalid", { font: { bold: true } });
    });
  });

  describe("toWorksheetData", () => {
    it("should generate worksheet data with headers", () => {
      const data: DataRow[] = [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 }
      ];
      
      const columns: ColumnDefinition[] = [
        { key: "name", header: "Name" },
        { key: "age", header: "Age" }
      ];
      
      const sheet = new Sheet(data, columns, { name: "Test" });
      const worksheetData = sheet.toWorksheetData();
      
      expect(worksheetData.data[0]).toEqual(["Name", "Age"]);
      expect(worksheetData.data[1]).toEqual(["Alice", 30]);
      expect(worksheetData.data[2]).toEqual(["Bob", 25]);
    });

    it("should include column widths for numeric widths", () => {
      const columns: ColumnDefinition[] = [
        { key: "a", width: 100 },
        { key: "b", width: 200 }
      ];
      
      const sheet = new Sheet([{ a: 1, b: 2 }], columns, { name: "Test" });
      const worksheetData = sheet.toWorksheetData();
      
      expect(worksheetData.columnWidths).toEqual([100, 200]);
    });

    it("should calculate auto widths", () => {
      const columns: ColumnDefinition[] = [
        { key: "short", width: "auto" },
        { key: "long", width: "auto" }
      ];
      
      const data = [
        { short: "a", long: "this is a very long text" }
      ];
      
      const sheet = new Sheet(data, columns, { name: "Test" });
      const worksheetData = sheet.toWorksheetData();
      
      expect(worksheetData.columnWidths).toBeDefined();
      expect(worksheetData.columnWidths![0]).toBeLessThan(worksheetData.columnWidths![1]);
    });

    it("should apply patterns during data processing", () => {
      const data: DataRow[] = [
        { value: "A" },
        { value: "B" },
        { value: "A" }
      ];

      const columns: ColumnDefinition[] = [{
        key: "value",
        header: "Value",
        patterns: {
          bgColorPattern: "colorPerDiff"
        }
      }];

      const sheet = new Sheet(data, columns, { name: "Test" });
      const worksheetData = sheet.toWorksheetData();

      expect(worksheetData.data).toHaveLength(4);
      expect(worksheetData.data[0]).toEqual(["Value"]);
    });

    it("should apply custom pattern functions", () => {
      const customPattern = () => ({ fill: { fgColor: "#FF0000" } });
      const data: DataRow[] = [{ val: 1 }, { val: 2 }];

      const columns: ColumnDefinition[] = [{
        key: "val",
        header: "Val",
        patterns: {
          custom: [customPattern, "zebra"]
        }
      }];

      const sheet = new Sheet(data, columns, { name: "CustomPatterns" });
      const worksheetData = sheet.toWorksheetData();

      expect(worksheetData.data).toHaveLength(3);
    });
  });

  describe("getColData updateStyles callback", () => {
    it("should update column styles via callback", () => {
      const data: DataRow[] = [
        { score: 100 },
        { score: 200 }
      ];

      const columns: ColumnDefinition[] = [{
        key: "score",
        header: "Score"
      }];

      const sheet = new Sheet(data, columns, { name: "Callback" });
      const colData = sheet.getColData("score");

      colData.updateStyles({ font: { bold: true } });

      const styles = sheet.getColumnStyles("score");
      expect(styles.font?.bold).toBe(true);
    });
  });

  describe("getRowData updateStyles callback", () => {
    it("should update row styles via callback", () => {
      const data: DataRow[] = [{ a: 1 }, { a: 2 }];
      const columns: ColumnDefinition[] = [{ key: "a" }];

      const sheet = new Sheet(data, columns, { name: "RowCallback" });
      const rowData = sheet.getRowData(0);

      rowData.updateStyles({ fill: { fgColor: "#00FF00" } });

      const styles = sheet.getRowStyles(0);
      expect(styles).toBeDefined();
    });
  });
});