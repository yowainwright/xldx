import type {
  ColumnPattern,
  PatternFunction,
  ColumnDefinition,
  ColorTheme,
  PatternContext,
} from "../../../src/index";
import { afterEach, describe, it, expect, beforeAll, beforeEach } from "bun:test";
import { Xldx } from "../../../src/browser/index";
import { setTheme } from "../../../src/utils";
import { defaultTheme } from "../../../src/themes/index";
import { setupDOMMocks, resetMocks, mockElement, mockDocument, mockURL } from "./utils.test";
afterEach(() => setTheme(defaultTheme));
describe("Browser Integration Tests", testBrowserIntegrationTests);
function testBrowserIntegrationTests() {
  beforeAll(() => {
    setupDOMMocks();
  });
  beforeEach(() => {
    resetMocks();
  });
  describe("download", testDownload);
  describe("End-to-end XLSX generation", testEndToEndXLSXGeneration);
  describe("toBlob", testToBlob);
  describe("SheetsData format (browser)", testSheetsDataFormatBrowser);
  describe("JSON export/import (browser)", testJSONExportImportBrowser);
  describe("Sheet manipulation (browser)", testSheetManipulationBrowser);
  describe("Theme support (browser)", testThemeSupportBrowser);
  describe("Custom patterns (browser)", testCustomPatternsBrowser);
  describe("Roundtrip verification (browser)", testRoundtripVerificationBrowser);
}
function testDownload() {
  it("should trigger browser download", testTriggerBrowserDownload);
  it("should use default filename", testUseDefaultFilename);
}
async function testTriggerBrowserDownload() {
  const xldx = new Xldx([{ a: 1 }]);
  xldx.createSheet({ name: "Test" }, { key: "a" });
  await xldx.download("test.xlsx");
  expect(mockDocument.createElement).toHaveBeenCalledWith("a");
  expect(mockElement.download).toBe("test.xlsx");
  expect(mockElement.click).toHaveBeenCalled();
  expect(mockURL.createObjectURL).toHaveBeenCalled();
  expect(mockURL.revokeObjectURL).toHaveBeenCalled();
}
async function testUseDefaultFilename() {
  const xldx = new Xldx([{ b: 2 }]);
  xldx.createSheet({ name: "Default" }, { key: "b" });
  await xldx.download();
  expect(mockElement.download).toBe("download.xlsx");
}
function testEndToEndXLSXGeneration() {
  it("should generate XLSX as Uint8Array", testGenerateXLSXAsUint8Array);
  it("should generate XLSX with patterns", testGenerateXLSXWithPatterns);
  it("should handle special characters", testHandleSpecialCharacters);
  it("should handle various data types", testHandleVariousDataTypes);
}
async function testGenerateXLSXAsUint8Array() {
  const data = createGenerateXLSXAsUint8ArrayData();
  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "Scores" },
    { key: "name", header: "Name" },
    { key: "score", header: "Score" },
  );
  const uint8Array = await xldx.toUint8Array();
  expect(uint8Array).toBeInstanceOf(Uint8Array);
  expect(uint8Array.length).toBeGreaterThan(0);
  expect(uint8Array[0]).toBe(0x50);
  expect(uint8Array[1]).toBe(0x4b);
}
async function testGenerateXLSXWithPatterns() {
  const data = createGenerateXLSXWithPatternsData();
  const xldx = new Xldx(data);
  const patterns2: ColumnPattern | undefined = {
    bgColorPattern: "colorPerDiff",
  };
  const patterns3: ColumnPattern | undefined = {
    bgColorPattern: "zebra",
  };
  xldx.createSheet(
    { name: "Patterns" },
    createGenerateXLSXWithPatternsFixture(patterns2),
    createGenerateXLSXWithPatternsFixture2(patterns3),
  );
  const uint8Array = await xldx.toUint8Array();
  expect(uint8Array.length).toBeGreaterThan(0);
}
async function testHandleSpecialCharacters() {
  const data = createHandleSpecialCharactersData();
  const xldx = new Xldx(data);
  xldx.createSheet({ name: "Special" }, { key: "text", header: "Text" });
  const uint8Array = await xldx.toUint8Array();
  expect(uint8Array.length).toBeGreaterThan(0);
  const result = await Xldx.read(uint8Array);
  expect(result.sheets[0].data[1][0]).toBe("<script>alert('xss')</script>");
}
async function testHandleVariousDataTypes() {
  const float2 = -1.5;
  const data = createHandleVariousDataTypesData(float2);
  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "Types" },
    { key: "str", header: "String" },
    { key: "num", header: "Number" },
    { key: "float", header: "Float" },
    { key: "bool", header: "Boolean" },
  );
  const uint8Array = await xldx.toUint8Array();
  const result = await Xldx.read(uint8Array);
  expect(result.sheets[0].data[1]).toEqual(["text", 42, 3.14, true]);
  expect(result.sheets[0].data[2]).toEqual(["", 0, -1.5, false]);
}
function testToBlob() {
  it("should return a valid Blob", testReturnAValidBlob);
  it("should create blob from complex data", testCreateBlobFromComplexData);
}
async function testReturnAValidBlob() {
  const xldx = new Xldx([{ a: 1, b: 2 }]);
  xldx.createSheet({ name: "Test" }, { key: "a", header: "A" }, { key: "b", header: "B" });
  const blob = await xldx.toBlob();
  expect(blob).toBeInstanceOf(Blob);
  expect(blob.size).toBeGreaterThan(0);
  expect(blob.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
async function testCreateBlobFromComplexData() {
  const data = Array.from({ length: 100 }, (_, index) => createBlobItem(index));
  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "Items" },
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    { key: "value", header: "Value" },
  );
  const blob = await xldx.toBlob();
  expect(blob.size).toBeGreaterThan(1000);
}
function createBlobItem(index: number) {
  const id = index + 1;
  const name = `Item ${id}`;
  const value = Math.random() * 1000;
  const item = createBlobFromComplexDataResult2(id, name, value);
  return item;
}
function testSheetsDataFormatBrowser() {
  it("should handle column-based data format", testHandleColumnBasedDataFormat);
  it("should handle multiple sheets from SheetsData", testHandleMultipleSheetsFromSheetsData);
}
async function testHandleColumnBasedDataFormat() {
  const col12 = ["A", "B", "C"];
  const col22 = [1, 2, 3];
  const data2 = createHandleColumnBasedDataFormatData2(col12, col22);
  const sheets2 = createHandleColumnBasedDataFormatSheets2(data2);
  const sheetsData = {
    sheets: sheets2,
  };
  const xldx = new Xldx(sheetsData);
  const uint8Array = await xldx.toUint8Array();
  const result = await Xldx.read(uint8Array);
  expect(result.sheets[0].name).toBe("ColumnFormat");
  expect(result.sheets[0].data[1]).toEqual(["A", 1]);
}
async function testHandleMultipleSheetsFromSheetsData() {
  const x2 = [1, 2];
  const data3 = { x: x2 };
  const y2 = [3, 4];
  const data4 = { y: y2 };
  const sheets3 = createHandleMultipleSheetsFromSheetsDataSheets3(data3, data4);
  const sheetsData = {
    sheets: sheets3,
  };
  const xldx = new Xldx(sheetsData);
  const uint8Array = await xldx.toUint8Array();
  const result = await Xldx.read(uint8Array);
  expect(result.sheets).toHaveLength(2);
}
function testJSONExportImportBrowser() {
  it("should export to JSON and recreate", testExportToJSONAndRecreate);
}
async function testExportToJSONAndRecreate() {
  const data = [{ item: "test", qty: 10 }];
  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "Export" },
    { key: "item", header: "Item" },
    { key: "qty", header: "Quantity" },
  );
  const json = xldx.toJSON();
  expect(json.sheets).toHaveLength(1);
  expect(json.sheets[0].name).toBe("Export");
  const restored = Xldx.fromJSON(json);
  const uint8Array = await restored.toUint8Array();
  expect(uint8Array.length).toBeGreaterThan(0);
}
function testSheetManipulationBrowser() {
  it("should update row data and regenerate", testUpdateRowDataAndRegenerate);
  it("should update column data", testUpdateColumnData);
}
async function testUpdateRowDataAndRegenerate() {
  const data = [{ name: "Original", value: 100 }];
  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "Update" },
    { key: "name", header: "Name" },
    { key: "value", header: "Value" },
  );
  const sheetData = xldx.getSheetData("Update");
  sheetData.updateRowData(0, { value: 999 });
  const updatedRows = sheetData.getRowsData();
  expect(updatedRows[0].value).toBe(999);
}
async function testUpdateColumnData() {
  const data = [{ a: 1 }, { a: 2 }, { a: 3 }];
  const xldx = new Xldx(data);
  xldx.createSheet({ name: "Cols" }, { key: "a" });
  const sheetData = xldx.getSheetData("Cols");
  sheetData.updateColumnData("a", [10, 20, 30]);
  const columnData = sheetData.getColumnData();
  expect(columnData.a).toEqual([10, 20, 30]);
}
function testThemeSupportBrowser() {
  it("should apply theme and generate XLSX", testApplyThemeAndGenerateXLSX);
}
async function testApplyThemeAndGenerateXLSX() {
  const base2 = createApplyThemeAndGenerateXLSXBase2();
  const text2 = createApplyThemeAndGenerateXLSXText2();
  const background2 = createApplyThemeAndGenerateXLSXBackground2();
  const customTheme = createApplyThemeAndGenerateXLSXCustomTheme(base2, text2, background2);
  const xldx = new Xldx([{ a: 1 }]);
  xldx.setTheme(customTheme);
  const patterns4: ColumnPattern | undefined = {
    bgColorPattern: "zebra",
  };
  xldx.createSheet({ name: "Themed" }, { key: "a", patterns: patterns4 });
  const uint8Array = await xldx.toUint8Array();
  expect(uint8Array.length).toBeGreaterThan(0);
}
function testCustomPatternsBrowser() {
  it("should apply custom pattern function", testApplyCustomPatternFunction);
}
async function testApplyCustomPatternFunction() {
  const data = [{ score: 75 }, { score: 25 }, { score: 100 }];
  const customPatterns: Record<string, PatternFunction> | undefined = {
    highLow: highLowPattern,
  };
  const xldx = new Xldx(data, {
    customPatterns: customPatterns,
  });
  const patterns5: ColumnPattern | undefined = {
    bgColorPattern: "highLow",
  };
  xldx.createSheet({ name: "Custom" }, createApplyCustomPatternFunctionFixture(patterns5));
  const uint8Array = await xldx.toUint8Array();
  expect(uint8Array.length).toBeGreaterThan(0);
}
function highLowPattern(context: PatternContext) {
  const { value } = context;
  const isHigh = typeof value === "number" && value > 50;
  const fgColor = isHigh ? "#00FF00" : "#FF0000";
  const fill = { fgColor };
  const style = { fill };
  return style;
}
function testRoundtripVerificationBrowser() {
  it(
    "should preserve data through generate -> read cycle",
    testPreserveDataThroughGenerateReadCycle,
  );
}
async function testPreserveDataThroughGenerateReadCycle() {
  const originalData = createPreserveDataThroughGenerateReadCycleOriginalData();
  const xldx = new Xldx(originalData);
  xldx.createSheet(
    { name: "Roundtrip" },
    { key: "name", header: "Name" },
    { key: "value", header: "Value" },
    { key: "active", header: "Active" },
  );
  const uint8Array = await xldx.toUint8Array();
  const result = await Xldx.read(uint8Array);
  expect(result.sheets[0].data[0]).toEqual(["Name", "Value", "Active"]);
  expect(result.sheets[0].data[1]).toEqual(["Test 1", 100, true]);
  expect(result.sheets[0].data[2]).toEqual(["Test 2", 200, false]);
}
function createGenerateXLSXAsUint8ArrayData() {
  const fixture = [
    { name: "Alice", score: 95 },
    { name: "Bob", score: 87 },
  ];
  return fixture;
}
function createGenerateXLSXWithPatternsData() {
  const fixture = [
    { category: "A", value: 100 },
    { category: "B", value: 200 },
    { category: "A", value: 150 },
  ];
  return fixture;
}
function createGenerateXLSXWithPatternsFixture(patterns2: ColumnPattern | undefined) {
  const fixture: ColumnDefinition = {
    key: "category",
    header: "Category",
    patterns: patterns2,
  };
  return fixture;
}
function createGenerateXLSXWithPatternsFixture2(patterns3: ColumnPattern | undefined) {
  const fixture: ColumnDefinition = {
    key: "value",
    header: "Value",
    patterns: patterns3,
  };
  return fixture;
}
function createHandleSpecialCharactersData() {
  const fixture = [
    { text: "<script>alert('xss')</script>" },
    { text: "日本語テスト" },
    { text: "Emoji: 🎉🚀✨" },
  ];
  return fixture;
}
function createHandleVariousDataTypesData(float2: -1.5) {
  const fixture = [
    { str: "text", num: 42, float: 3.14, bool: true },
    { str: "", num: 0, float: float2, bool: false },
  ];
  return fixture;
}
function createBlobFromComplexDataResult2(id2: number, name2: string, value2: number) {
  const fixture: {
    id: number;
    name: string;
    value: number;
  } = {
    id: id2,
    name: name2,
    value: value2,
  };
  return fixture;
}
function createHandleColumnBasedDataFormatData2(col12: string[], col22: number[]) {
  const fixture = {
    col1: col12,
    col2: col22,
  };
  return fixture;
}
function createHandleColumnBasedDataFormatSheets2(data2: { col1: string[]; col2: number[] }) {
  const fixture = [
    {
      name: "ColumnFormat",
      data: data2,
    },
  ];
  return fixture;
}
function createHandleMultipleSheetsFromSheetsDataSheets3(
  data3: {
    x: number[];
  },
  data4: {
    y: number[];
  },
) {
  const fixture = [
    {
      name: "Sheet1",
      data: data3,
    },
    {
      name: "Sheet2",
      data: data4,
    },
  ];
  return fixture;
}
function createApplyThemeAndGenerateXLSXBase2() {
  const fixture = {
    50: "#FFF5F2",
    100: "#FFE6DF",
    200: "#FFCCBF",
    300: "#FFB39F",
    400: "#FF997F",
    500: "#FF805F",
    600: "#FF6640",
    700: "#FF4C20",
    800: "#FF3300",
    900: "#E62E00",
  };
  return fixture;
}
function createApplyThemeAndGenerateXLSXText2() {
  const fixture = {
    primary: "#1A1A1A",
    secondary: "#666666",
    disabled: "#999999",
    inverse: "#FFFFFF",
  };
  return fixture;
}
function createApplyThemeAndGenerateXLSXBackground2() {
  const fixture = {
    default: "#FFFFFF",
    paper: "#F5F5F5",
    neutral: "#1A1A1A",
  };
  return fixture;
}
function createApplyThemeAndGenerateXLSXCustomTheme(
  base2: ColorTheme["base"],
  text2: ColorTheme["text"],
  background2: ColorTheme["background"],
) {
  const fixture = {
    primary: "#FF5733",
    secondary: "#8B5CF6",
    base: base2,
    text: text2,
    background: background2,
    success: "#4CAF50",
    warning: "#FF9800",
    error: "#F44336",
    info: "#2196F3",
  };
  return fixture;
}
function createApplyCustomPatternFunctionFixture(patterns5: ColumnPattern | undefined) {
  const fixture: ColumnDefinition = {
    key: "score",
    header: "Score",
    patterns: patterns5,
  };
  return fixture;
}
function createPreserveDataThroughGenerateReadCycleOriginalData() {
  const fixture = [
    { name: "Test 1", value: 100, active: true },
    { name: "Test 2", value: 200, active: false },
  ];
  return fixture;
}
