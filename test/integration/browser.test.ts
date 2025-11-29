import { describe, it, expect, beforeAll, beforeEach } from "bun:test";
import { Xldx } from "../../src/browser";
import { setupDOMMocks, resetMocks, mockElement, mockDocument, mockURL } from "../mocks/dom";

describe("Browser Integration Tests", () => {
  beforeAll(() => {
    setupDOMMocks();
  });

  beforeEach(() => {
    resetMocks();
  });

  describe("download", () => {
    it("should trigger browser download", async () => {
      const xldx = new Xldx([{ a: 1 }]);
      xldx.createSheet({ name: "Test" }, { key: "a" });

      await xldx.download("test.xlsx");

      expect(mockDocument.createElement).toHaveBeenCalledWith("a");
      expect(mockElement.download).toBe("test.xlsx");
      expect(mockElement.click).toHaveBeenCalled();
      expect(mockURL.createObjectURL).toHaveBeenCalled();
      expect(mockURL.revokeObjectURL).toHaveBeenCalled();
    });

    it("should use default filename", async () => {
      const xldx = new Xldx([{ b: 2 }]);
      xldx.createSheet({ name: "Default" }, { key: "b" });

      await xldx.download();

      expect(mockElement.download).toBe("download.xlsx");
    });
  });

  describe("End-to-end XLSX generation", () => {
    it("should generate XLSX as Uint8Array", async () => {
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

      const uint8Array = await xldx.toUint8Array();

      expect(uint8Array).toBeInstanceOf(Uint8Array);
      expect(uint8Array.length).toBeGreaterThan(0);

      // ZIP signature
      expect(uint8Array[0]).toBe(0x50);
      expect(uint8Array[1]).toBe(0x4b);
    });

    it("should generate XLSX with patterns", async () => {
      const data = [
        { category: "A", value: 100 },
        { category: "B", value: 200 },
        { category: "A", value: 150 }
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

      const uint8Array = await xldx.toUint8Array();
      expect(uint8Array.length).toBeGreaterThan(0);
    });

    it("should handle special characters", async () => {
      const data = [
        { text: "<script>alert('xss')</script>" },
        { text: "日本語テスト" },
        { text: "Emoji: 🎉🚀✨" }
      ];

      const xldx = new Xldx(data);
      xldx.createSheet(
        { name: "Special" },
        { key: "text", header: "Text" }
      );

      const uint8Array = await xldx.toUint8Array();
      expect(uint8Array.length).toBeGreaterThan(0);

      // Read back and verify
      const result = await Xldx.read(uint8Array);
      expect(result.sheets[0].data[1][0]).toBe("<script>alert('xss')</script>");
    });

    it("should handle various data types", async () => {
      const data = [
        { str: "text", num: 42, float: 3.14, bool: true },
        { str: "", num: 0, float: -1.5, bool: false }
      ];

      const xldx = new Xldx(data);
      xldx.createSheet(
        { name: "Types" },
        { key: "str", header: "String" },
        { key: "num", header: "Number" },
        { key: "float", header: "Float" },
        { key: "bool", header: "Boolean" }
      );

      const uint8Array = await xldx.toUint8Array();

      const result = await Xldx.read(uint8Array);
      expect(result.sheets[0].data[1]).toEqual(["text", 42, 3.14, true]);
      expect(result.sheets[0].data[2]).toEqual(["", 0, -1.5, false]);
    });
  });

  describe("toBlob", () => {
    it("should return a valid Blob", async () => {
      const xldx = new Xldx([{ a: 1, b: 2 }]);
      xldx.createSheet(
        { name: "Test" },
        { key: "a", header: "A" },
        { key: "b", header: "B" }
      );

      const blob = await xldx.toBlob();

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    });

    it("should create blob from complex data", async () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: Math.random() * 1000
      }));

      const xldx = new Xldx(data);
      xldx.createSheet(
        { name: "Items" },
        { key: "id", header: "ID" },
        { key: "name", header: "Name" },
        { key: "value", header: "Value" }
      );

      const blob = await xldx.toBlob();
      expect(blob.size).toBeGreaterThan(1000);
    });
  });

  describe("SheetsData format (browser)", () => {
    it("should handle column-based data format", async () => {
      const sheetsData = {
        sheets: [
          {
            name: "ColumnFormat",
            data: {
              col1: ["A", "B", "C"],
              col2: [1, 2, 3]
            }
          }
        ]
      };

      const xldx = new Xldx(sheetsData);
      const uint8Array = await xldx.toUint8Array();

      const result = await Xldx.read(uint8Array);
      expect(result.sheets[0].name).toBe("ColumnFormat");
      expect(result.sheets[0].data[1]).toEqual(["A", 1]);
    });

    it("should handle multiple sheets from SheetsData", async () => {
      const sheetsData = {
        sheets: [
          {
            name: "Sheet1",
            data: { x: [1, 2] }
          },
          {
            name: "Sheet2",
            data: { y: [3, 4] }
          }
        ]
      };

      const xldx = new Xldx(sheetsData);
      const uint8Array = await xldx.toUint8Array();

      const result = await Xldx.read(uint8Array);
      expect(result.sheets).toHaveLength(2);
    });
  });

  describe("JSON export/import (browser)", () => {
    it("should export to JSON and recreate", async () => {
      const data = [{ item: "test", qty: 10 }];

      const xldx = new Xldx(data);
      xldx.createSheet(
        { name: "Export" },
        { key: "item", header: "Item" },
        { key: "qty", header: "Quantity" }
      );

      const json = xldx.toJSON();

      expect(json.sheets).toHaveLength(1);
      expect(json.sheets[0].name).toBe("Export");

      const restored = Xldx.fromJSON(json);
      const uint8Array = await restored.toUint8Array();
      expect(uint8Array.length).toBeGreaterThan(0);
    });
  });

  describe("Sheet manipulation (browser)", () => {
    it("should update row data and regenerate", async () => {
      const data = [
        { name: "Original", value: 100 }
      ];

      const xldx = new Xldx(data);
      xldx.createSheet(
        { name: "Update" },
        { key: "name", header: "Name" },
        { key: "value", header: "Value" }
      );

      const sheetData = xldx.getSheetData("Update");
      sheetData.updateRowData(0, { value: 999 });

      const updatedRows = sheetData.getRowsData();
      expect(updatedRows[0].value).toBe(999);
    });

    it("should update column data", async () => {
      const data = [
        { a: 1 },
        { a: 2 },
        { a: 3 }
      ];

      const xldx = new Xldx(data);
      xldx.createSheet({ name: "Cols" }, { key: "a" });

      const sheetData = xldx.getSheetData("Cols");
      sheetData.updateColumnData("a", [10, 20, 30]);

      const columnData = sheetData.getColumnData();
      expect(columnData.a).toEqual([10, 20, 30]);
    });
  });

  describe("Theme support (browser)", () => {
    it("should apply theme and generate XLSX", async () => {
      const customTheme = {
        primary: "#FF5733",
        base: {
          50: "#FFF5F2",
          100: "#FFE6DF",
          200: "#FFCCBF",
          300: "#FFB39F",
          400: "#FF997F",
          500: "#FF805F",
          600: "#FF6640",
          700: "#FF4C20",
          800: "#FF3300",
          900: "#E62E00"
        },
        text: {
          primary: "#1A1A1A",
          secondary: "#666666",
          disabled: "#999999",
          inverse: "#FFFFFF"
        },
        background: {
          default: "#FFFFFF",
          paper: "#F5F5F5",
          dark: "#1A1A1A"
        },
        success: "#4CAF50",
        warning: "#FF9800",
        error: "#F44336",
        info: "#2196F3"
      };

      const xldx = new Xldx([{ a: 1 }]);
      xldx.setTheme(customTheme);
      xldx.createSheet(
        { name: "Themed" },
        { key: "a", patterns: { bgColorPattern: "zebra" } }
      );

      const uint8Array = await xldx.toUint8Array();
      expect(uint8Array.length).toBeGreaterThan(0);
    });
  });

  describe("Custom patterns (browser)", () => {
    it("should apply custom pattern function", async () => {
      const customPattern = (context: any) => {
        if (context.value > 50) {
          return { fill: { fgColor: "#00FF00" } };
        }
        return { fill: { fgColor: "#FF0000" } };
      };

      const data = [
        { score: 75 },
        { score: 25 },
        { score: 100 }
      ];

      const xldx = new Xldx(data, {
        customPatterns: { highLow: customPattern }
      });

      xldx.createSheet(
        { name: "Custom" },
        {
          key: "score",
          header: "Score",
          patterns: { bgColorPattern: "highLow" }
        }
      );

      const uint8Array = await xldx.toUint8Array();
      expect(uint8Array.length).toBeGreaterThan(0);
    });
  });

  describe("Roundtrip verification (browser)", () => {
    it("should preserve data through generate -> read cycle", async () => {
      const originalData = [
        { name: "Test 1", value: 100, active: true },
        { name: "Test 2", value: 200, active: false }
      ];

      const xldx = new Xldx(originalData);
      xldx.createSheet(
        { name: "Roundtrip" },
        { key: "name", header: "Name" },
        { key: "value", header: "Value" },
        { key: "active", header: "Active" }
      );

      const uint8Array = await xldx.toUint8Array();
      const result = await Xldx.read(uint8Array);

      expect(result.sheets[0].data[0]).toEqual(["Name", "Value", "Active"]);
      expect(result.sheets[0].data[1]).toEqual(["Test 1", 100, true]);
      expect(result.sheets[0].data[2]).toEqual(["Test 2", 200, false]);
    });
  });
});
