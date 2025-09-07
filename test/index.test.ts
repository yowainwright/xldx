import { describe, it, expect } from "bun:test";
import { Xldx } from "../src/server";

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
});