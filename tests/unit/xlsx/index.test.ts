import { describe, it, expect } from "bun:test";
import { XlsxWriter, XlsxReader } from "../../../src/xlsx/index";
describe("XlsxWriter", testXlsxWriter);
describe("XlsxReader", testXlsxReader);
describe("XlsxWriter/XlsxReader roundtrip", testXlsxWriterXlsxReaderRoundtrip);
function testXlsxWriter() {
  describe("addWorksheet", testAddWorksheet);
  describe("generate", testGenerate);
}
function testAddWorksheet() {
  it("should add a worksheet with data", testAddAWorksheetWithData);
  it("should add multiple worksheets", testAddMultipleWorksheets);
  it("should handle column widths", testHandleColumnWidths);
}
function testAddAWorksheetWithData() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Sheet1", createAddAWorksheetWithDataFixture());
  const xlsx = writer.generate();
  expect(xlsx).toBeInstanceOf(Uint8Array);
  expect(xlsx.length).toBeGreaterThan(0);
}
function testAddMultipleWorksheets() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Sheet1", createAddMultipleWorksheetsFixture());
  writer.addWorksheet("Sheet2", createAddMultipleWorksheetsFixture2());
  const xlsx = writer.generate();
  expect(xlsx).toBeInstanceOf(Uint8Array);
}
function testHandleColumnWidths() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Sheet1", [["Name", "Age"]], [20, 10]);
  const xlsx = writer.generate();
  expect(xlsx).toBeInstanceOf(Uint8Array);
}
function testGenerate() {
  it("should generate valid ZIP structure", testGenerateValidZIPStructure);
  it("should handle string values", testHandleStringValues);
  it("should handle number values", testHandleNumberValues);
  it("should handle boolean values", testHandleBooleanValues);
  it("should handle null and undefined values", testHandleNullAndUndefinedValues);
  it("should handle Date values", testHandleDateValues);
  it("should handle Cell objects with value property", testHandleCellObjectsWithValueProperty);
  it("should escape XML special characters", testEscapeXMLSpecialCharacters);
  it(
    "should handle sheet names with special characters",
    testHandleSheetNamesWithSpecialCharacters,
  );
  it("should handle empty worksheet", testHandleEmptyWorksheet);
  it("should handle large column indices", testHandleLargeColumnIndices);
}
function testGenerateValidZIPStructure() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Test", [["Hello"]]);
  const xlsx = writer.generate();
  expect(xlsx[0]).toBe(0x50);
  expect(xlsx[1]).toBe(0x4b);
}
function testHandleStringValues() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Test", createHandleStringValuesFixture());
  const xlsx = writer.generate();
  expect(xlsx.length).toBeGreaterThan(0);
}
function testHandleNumberValues() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Test", createHandleNumberValuesFixture());
  const xlsx = writer.generate();
  expect(xlsx.length).toBeGreaterThan(0);
}
function testHandleBooleanValues() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Test", createHandleBooleanValuesFixture());
  const xlsx = writer.generate();
  expect(xlsx.length).toBeGreaterThan(0);
}
function testHandleNullAndUndefinedValues() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Test", createHandleNullAndUndefinedValuesFixture());
  const xlsx = writer.generate();
  expect(xlsx.length).toBeGreaterThan(0);
}
function testHandleDateValues() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Test", [["Date"], [new Date("2024-01-15")]]);
  const xlsx = writer.generate();
  expect(xlsx.length).toBeGreaterThan(0);
}
function testHandleCellObjectsWithValueProperty() {
  const writer = new XlsxWriter();
  const font2 = { bold: true };
  const style2 = { font: font2 };
  const style3 = {};
  writer.addWorksheet("Test", createHandleCellObjectsWithValuePropertyFixture(style2, style3));
  const xlsx = writer.generate();
  expect(xlsx.length).toBeGreaterThan(0);
}
function testEscapeXMLSpecialCharacters() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Test", [["<test>", "&value", '"quoted"', "'apostrophe'"]]);
  const xlsx = writer.generate();
  expect(xlsx.length).toBeGreaterThan(0);
}
function testHandleSheetNamesWithSpecialCharacters() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Sheet <1>", [["test"]]);
  const xlsx = writer.generate();
  expect(xlsx.length).toBeGreaterThan(0);
}
function testHandleEmptyWorksheet() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Empty", []);
  const xlsx = writer.generate();
  expect(xlsx.length).toBeGreaterThan(0);
}
function testHandleLargeColumnIndices() {
  const writer = new XlsxWriter();
  const row = Array(30).fill("test");
  writer.addWorksheet("Wide", [row]);
  const xlsx = writer.generate();
  expect(xlsx.length).toBeGreaterThan(0);
}
function testXlsxReader() {
  describe("read", testRead);
}
function testRead() {
  it("should read back written data", testReadBackWrittenData);
  it("should read multiple sheets", testReadMultipleSheets);
  it("should handle numbers correctly", testHandleNumbersCorrectly);
  it("should handle booleans correctly", testHandleBooleansCorrectly);
  it("should handle empty cells", testHandleEmptyCells);
  it("should handle XML-escaped content", testHandleXMLEscapedContent);
}
function testReadBackWrittenData() {
  const writer = new XlsxWriter();
  writer.addWorksheet("TestSheet", createReadBackWrittenDataFixture());
  const xlsx = writer.generate();
  const reader = new XlsxReader(xlsx);
  const result = reader.read();
  expect(result.sheets).toHaveLength(1);
  expect(result.sheets[0].name).toBe("TestSheet");
  expect(result.sheets[0].data[0]).toEqual(["Name", "Age"]);
  expect(result.sheets[0].data[1]).toEqual(["Alice", 30]);
  expect(result.sheets[0].data[2]).toEqual(["Bob", 25]);
}
function testReadMultipleSheets() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Sheet1", [["A"], ["B"]]);
  writer.addWorksheet("Sheet2", [["C"], ["D"]]);
  const xlsx = writer.generate();
  const reader = new XlsxReader(xlsx);
  const result = reader.read();
  expect(result.sheets).toHaveLength(2);
  expect(result.sheets[0].name).toBe("Sheet1");
  expect(result.sheets[1].name).toBe("Sheet2");
}
function testHandleNumbersCorrectly() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Numbers", [[1, 2.5, -3, 0]]);
  const xlsx = writer.generate();
  const reader = new XlsxReader(xlsx);
  const result = reader.read();
  expect(result.sheets[0].data[0]).toEqual([1, 2.5, -3, 0]);
}
function testHandleBooleansCorrectly() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Bools", [[true, false]]);
  const xlsx = writer.generate();
  const reader = new XlsxReader(xlsx);
  const result = reader.read();
  expect(result.sheets[0].data[0]).toEqual([true, false]);
}
function testHandleEmptyCells() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Sparse", createHandleEmptyCellsFixture());
  const xlsx = writer.generate();
  const reader = new XlsxReader(xlsx);
  const result = reader.read();
  expect(result.sheets[0].data[0][0]).toBe("A");
  expect(result.sheets[0].data[0][2]).toBe("C");
}
function testHandleXMLEscapedContent() {
  const writer = new XlsxWriter();
  writer.addWorksheet("Escaped", [["<tag>", "&amp;", '"quote"']]);
  const xlsx = writer.generate();
  const reader = new XlsxReader(xlsx);
  const result = reader.read();
  expect(result.sheets[0].data[0][0]).toBe("<tag>");
  expect(result.sheets[0].data[0][1]).toBe("&amp;");
}
function testXlsxWriterXlsxReaderRoundtrip() {
  it("should preserve data through write/read cycle", testPreserveDataThroughWriteReadCycle);
  it("should handle shared strings efficiently", testHandleSharedStringsEfficiently);
}
function testPreserveDataThroughWriteReadCycle() {
  const originalData = createPreserveDataThroughWriteReadCycleOriginalData();
  const writer = new XlsxWriter();
  writer.addWorksheet("RoundTrip", originalData);
  const xlsx = writer.generate();
  const reader = new XlsxReader(xlsx);
  const result = reader.read();
  expect(result.sheets[0].data[0]).toEqual(["Header1", "Header2", "Header3"]);
  expect(result.sheets[0].data[1]).toEqual(["String", 123, true]);
  expect(result.sheets[0].data[2]).toEqual(["Another", 456.78, false]);
}
function testHandleSharedStringsEfficiently() {
  const writer = new XlsxWriter();
  writer.addWorksheet("SharedStrings", createHandleSharedStringsEfficientlyFixture());
  const xlsx = writer.generate();
  const reader = new XlsxReader(xlsx);
  const result = reader.read();
  expect(result.sheets[0].data[0]).toEqual(["Repeated", "Repeated", "Repeated"]);
  expect(result.sheets[0].data[1][1]).toBe("Unique");
}
function createAddAWorksheetWithDataFixture() {
  const fixture: any[][] = [
    ["Name", "Age"],
    ["Alice", 30],
    ["Bob", 25],
  ];
  return fixture;
}
function createAddMultipleWorksheetsFixture() {
  const fixture: any[][] = [
    ["A", "B"],
    [1, 2],
  ];
  return fixture;
}
function createAddMultipleWorksheetsFixture2() {
  const fixture: any[][] = [
    ["C", "D"],
    [3, 4],
  ];
  return fixture;
}
function createHandleStringValuesFixture() {
  const fixture: any[][] = [
    ["String1", "String2"],
    ["Hello", "World"],
  ];
  return fixture;
}
function createHandleNumberValuesFixture() {
  const fixture: any[][] = [
    [1, 2, 3],
    [4.5, 6.7, 8.9],
  ];
  return fixture;
}
function createHandleBooleanValuesFixture() {
  const fixture: any[][] = [
    [true, false],
    [false, true],
  ];
  return fixture;
}
function createHandleNullAndUndefinedValuesFixture() {
  const fixture: any[][] = [
    [null, undefined, ""],
    ["value", null, undefined],
  ];
  return fixture;
}
function createHandleCellObjectsWithValuePropertyFixture(
  style2: {
    font: {
      bold: boolean;
    };
  },
  style3: {},
) {
  const fixture: any[][] = [[{ value: "Test", style: style2 }], [{ value: 123, style: style3 }]];
  return fixture;
}
function createReadBackWrittenDataFixture() {
  const fixture: any[][] = [
    ["Name", "Age"],
    ["Alice", 30],
    ["Bob", 25],
  ];
  return fixture;
}
function createHandleEmptyCellsFixture() {
  const fixture: any[][] = [
    ["A", null, "C"],
    [null, "B", null],
  ];
  return fixture;
}
function createPreserveDataThroughWriteReadCycleOriginalData() {
  const fixture = [
    ["Header1", "Header2", "Header3"],
    ["String", 123, true],
    ["Another", 456.78, false],
    ["", null, 0],
  ];
  return fixture;
}
function createHandleSharedStringsEfficientlyFixture() {
  const fixture: any[][] = [
    ["Repeated", "Repeated", "Repeated"],
    ["Repeated", "Unique", "Repeated"],
  ];
  return fixture;
}
