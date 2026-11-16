import type { SheetDataAPI, ColumnData } from "../../../src/types";
import type {
  FillStyle,
  FontStyle,
  ColumnPattern,
  SheetOptions,
  ColumnDefinition,
} from "../../../src/index";
import { afterEach, describe, it, expect } from "bun:test";
import { Xldx } from "../../../src/server/index";
import {
  zebraBg,
  bgColorBasedOnDiff,
  txtColorBasedOnDiff,
  createSetWidthBasedOnCharacterCount,
  applyPattern,
  buildPatternContext,
  setTheme,
} from "../../../src/utils";
import { defaultTheme } from "../../../src/themes/index";
import type { PatternContext, DataRow, ColorTheme } from "../../../src/index";
afterEach(() => setTheme(defaultTheme));
describe("index", testIndex);
function testIndex() {
  describe("getSheetData", testGetSheetData);
  describe("Pattern Functions", testPatternFunctions);
  describe("Xldx class methods", testXldxClassMethods);
}
function testGetSheetData() {
  it("should get rows data from a sheet", testGetRowsDataFromASheet);
  it("should get column data from a sheet", testGetColumnDataFromASheet);
  it("should get sheet data by index", testGetSheetDataByIndex);
  it("should update row data", testUpdateRowData);
  it("should update column data", testUpdateColumnData);
  it("should throw error for non-existent sheet", testThrowErrorForNonExistentSheet);
  it("should handle multiple sheets independently", testHandleMultipleSheetsIndependently);
}
function testGetRowsDataFromASheet() {
  const data = createGetRowsDataFromASheetData();
  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "People" },
    { key: "name", header: "Name" },
    { key: "age", header: "Age" },
    { key: "city", header: "City" },
  );
  const sheetData = xldx.getSheetData("People");
  const rows = sheetData.getRowsData();
  expect(rows).toEqual(data);
}
function testGetColumnDataFromASheet() {
  const data = createGetColumnDataFromASheetData();
  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "People" },
    { key: "name", header: "Name" },
    { key: "age", header: "Age" },
  );
  const sheetData = xldx.getSheetData("People");
  const columnData = sheetData.getColumnData();
  const name2: unknown[] = ["Alice", "Bob", "Charlie"];
  const age2: unknown[] = [30, 25, 35];
  expect(columnData).toEqual(createGetColumnDataFromASheetFixture(name2, age2));
}
function testGetSheetDataByIndex() {
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
}
function testUpdateRowData() {
  const data = createUpdateRowDataData();
  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "People" },
    { key: "name", header: "Name" },
    { key: "age", header: "Age" },
  );
  const sheetData = xldx.getSheetData("People");
  sheetData.updateRowData(0, { age: 31 });
  const updatedRows = sheetData.getRowsData();
  expect(updatedRows[0].age).toBe(31);
  expect(updatedRows[0].name).toBe("Alice");
}
function testUpdateColumnData() {
  const data = createUpdateColumnDataData();
  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "People" },
    { key: "name", header: "Name" },
    { key: "age", header: "Age" },
  );
  const sheetData = xldx.getSheetData("People");
  sheetData.updateColumnData("age", [31, 26, 36]);
  const updatedColumns = sheetData.getColumnData();
  expect(updatedColumns.age).toEqual([31, 26, 36]);
}
function testThrowErrorForNonExistentSheet() {
  const xldx = new Xldx([]);
  xldx.createSheet({ name: "Sheet1" }, { key: "a", header: "A" });
  expect(() => {
    const result2: SheetDataAPI = xldx.getSheetData("NonExistent");
    return result2;
  }).toThrow("Sheet NonExistent not found");
  expect(() => {
    const result3: SheetDataAPI = xldx.getSheetData(5);
    return result3;
  }).toThrow("Sheet at index 5 not found");
}
function testHandleMultipleSheetsIndependently() {
  const xldx = new Xldx([{ a: 1, b: 2 }]);
  xldx.createSheet({ name: "Sheet1" }, { key: "a", header: "A" }, { key: "b", header: "B" });
  const sheet1 = xldx.getSheetData("Sheet1");
  sheet1.updateRowData(0, { b: 20 });
  expect(sheet1.getRowsData()[0]).toEqual({ a: 1, b: 20 });
}
function testPatternFunctions() {
  it("should apply zebra background to even rows", testApplyZebraBackgroundToEvenRows);
  it("should return null for odd zebra rows", testReturnNullForOddZebraRows);
  it(
    "should assign different colors to different values",
    testAssignDifferentColorsToDifferentValues,
  );
  it("should highlight changed text values", testHighlightChangedTextValues);
  it("should calculate column width from data", testCalculateColumnWidthFromData);
  it("should apply patterns when creating sheets", testApplyPatternsWhenCreatingSheets);
  it("should apply pattern by name or function", testApplyPatternByNameOrFunction);
  it("should build pattern context with proper offsets", testBuildPatternContextWithProperOffsets);
}
function testApplyZebraBackgroundToEvenRows() {
  const rowData: Record<string, any> = { col1: "test" };
  const allData: Record<string, any>[] = [{ col1: "test" }];
  const context: PatternContext = createApplyZebraBackgroundToEvenRowsContext(rowData, allData);
  const result = zebraBg(context);
  const { 100: fgColor } = defaultTheme.base;
  const fill2: FillStyle | undefined = createApplyZebraBackgroundToEvenRowsFill2(fgColor);
  expect(result).toEqual({
    fill: fill2,
  });
}
function testReturnNullForOddZebraRows() {
  const rowData2: Record<string, any> = { col1: "test" };
  const allData2: Record<string, any>[] = [{ col1: "test" }];
  const context: PatternContext = createReturnNullForOddZebraRowsContext(rowData2, allData2);
  const result = zebraBg(context);
  expect(result).toBeNull();
}
function testAssignDifferentColorsToDifferentValues() {
  const allData: DataRow[] = createAssignDifferentColorsToDifferentValuesAllData();
  const rowData3: Record<string, any> = { category: "A" };
  const contextA: PatternContext = createAssignDifferentColorsToDifferentValuesContextA(
    rowData3,
    allData,
  );
  const rowData4: Record<string, any> = { category: "B" };
  const contextB: PatternContext = createAssignDifferentColorsToDifferentValuesContextB(
    rowData4,
    allData,
  );
  const resultA = bgColorBasedOnDiff(contextA);
  const resultB = bgColorBasedOnDiff(contextB);
  expect(resultA?.fill?.fgColor).toBeDefined();
  expect(resultB?.fill?.fgColor).toBeDefined();
  expect(resultA?.fill?.fgColor).not.toEqual(resultB?.fill?.fgColor);
}
function testHighlightChangedTextValues() {
  const rowData5: Record<string, any> = { col1: "new" };
  const allData3: Record<string, any>[] = [{ col1: "old" }, { col1: "new" }];
  const context: PatternContext = createHighlightChangedTextValuesContext(rowData5, allData3);
  const result = txtColorBasedOnDiff(context);
  const { primary: color2 } = defaultTheme;
  const font2: FontStyle | undefined = createHighlightChangedTextValuesFont2(color2);
  expect(result).toEqual({
    font: font2,
  });
}
function testCalculateColumnWidthFromData() {
  const columnData = ["short", "medium text", "long text with more characters"];
  const calculator = createSetWidthBasedOnCharacterCount(columnData);
  const result = calculator();
  expect(result).toBeDefined();
  expect(result?.width).toBeGreaterThan(10);
  expect(result?.wrapText).toBe(true);
}
async function testApplyPatternsWhenCreatingSheets() {
  const data = createApplyPatternsWhenCreatingSheetsData();
  const xldx = new Xldx(data);
  const patterns2: ColumnPattern | undefined = {
    bgColorPattern: "zebra",
  };
  const patterns3: ColumnPattern | undefined = {
    bgColorPattern: "colorPerDiff",
  };
  xldx.createSheet(
    { name: "Scores" },
    createApplyPatternsWhenCreatingSheetsFixture(patterns2),
    createApplyPatternsWhenCreatingSheetsFixture2(patterns3),
  );
  const sheetData = xldx.getSheetData(0);
  const rows = sheetData.getRowsData();
  expect(rows).toHaveLength(3);
  expect(rows[0]).toEqual({ name: "Alice", score: 95 });
}
function testApplyPatternByNameOrFunction() {
  const rowData6: Record<string, any> = { col1: "test" };
  const allData4: Record<string, any>[] = [{ col1: "test" }];
  const context: PatternContext = createApplyPatternByNameOrFunctionContext(rowData6, allData4);
  const result = applyPattern("zebra", context);
  expect(result).toBeDefined();
  const customPattern = () => {
    const font3 = { color: "#FF0000" };
    const result4 = {
      font: font3,
    };
    return result4;
  };
  const customResult = applyPattern(customPattern, context);
  const font4: FontStyle | undefined = {
    color: "#FF0000",
  };
  expect(customResult).toEqual({ font: font4 });
}
function testBuildPatternContextWithProperOffsets() {
  const rowData7 = { col1: "A", col2: "B" };
  const allData5 = [{ col1: "A", col2: "B" }];
  const params = createBuildPatternContextWithProperOffsetsParams(rowData7, allData5);
  const context = buildPatternContext(params);
  expect(context.rowIndex).toBe(2);
  expect(context.columnIndex).toBe(1);
  expect(context.value).toBe("B");
  expect(context.columnKey).toBe("col2");
}
function testXldxClassMethods() {
  describe("setTheme", testSetTheme);
  describe("createColumn", testCreateColumn);
  describe("createColumns", testCreateColumns);
  describe("createSheets", testCreateSheets);
  describe("toJSON", testToJSON);
  describe("fromJSON", testFromJSON);
  describe("read", testRead);
  describe("toUint8Array", testToUint8Array);
  describe("Server methods", testServerMethods);
  describe("Multi-sheet data (SheetsData)", testMultiSheetDataSheetsData);
}
function testSetTheme() {
  it(
    "should set a custom theme and return this for chaining",
    testSetACustomThemeAndReturnThisForChaining,
  );
}
function testSetACustomThemeAndReturnThisForChaining() {
  const customTheme: ColorTheme = createSetACustomThemeAndReturnThisForChainingCustomTheme();
  const xldx = new Xldx([{ a: 1 }]);
  const result = xldx.setTheme(customTheme);
  expect(result).toBe(xldx);
}
function testCreateColumn() {
  it("should return the column definition unchanged", testReturnTheColumnDefinitionUnchanged);
}
function testReturnTheColumnDefinitionUnchanged() {
  const xldx = new Xldx([]);
  const definition = { key: "test", header: "Test Header", width: 100 };
  const result = xldx.createColumn(definition);
  expect(result).toEqual(definition);
}
function testCreateColumns() {
  it("should return the column definitions unchanged", testReturnTheColumnDefinitionsUnchanged);
}
function testReturnTheColumnDefinitionsUnchanged() {
  const xldx = new Xldx([]);
  const definitions = createReturnTheColumnDefinitionsUnchangedDefinitions();
  const result = xldx.createColumns(definitions);
  expect(result).toEqual(definitions);
}
function testCreateSheets() {
  it("should create multiple sheets at once", testCreateMultipleSheetsAtOnce);
}
function testCreateMultipleSheetsAtOnce() {
  const data = createMultipleSheetsAtOnceData();
  const xldx = new Xldx(data);
  const options2: SheetOptions = { name: "Sheet1" };
  const columns2: ColumnDefinition[] = [{ key: "name", header: "Name" }];
  const options3: SheetOptions = { name: "Sheet2" };
  const columns3: ColumnDefinition[] = [{ key: "age", header: "Age" }];
  xldx.createSheets(createMultipleSheetsAtOnceFixture(options2, columns2, options3, columns3));
  const sheet1 = xldx.getSheetData("Sheet1");
  const sheet2 = xldx.getSheetData("Sheet2");
  expect(sheet1.getRowsData()).toEqual(data);
  expect(sheet2.getRowsData()).toEqual(data);
}
function testToJSON() {
  it("should export workbook as JSON", testExportWorkbookAsJSON);
  it("should export multiple sheets", testExportMultipleSheets);
}
function testExportWorkbookAsJSON() {
  const data = createExportWorkbookAsJSONData();
  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "Scores" },
    { key: "name", header: "Name" },
    { key: "score", header: "Score" },
  );
  const json = xldx.toJSON();
  expect(json.sheets).toHaveLength(1);
  expect(json.sheets[0].name).toBe("Scores");
  expect(json.sheets[0].data).toBeDefined();
}
function testExportMultipleSheets() {
  const xldx = new Xldx([{ a: 1 }]);
  xldx.createSheet({ name: "Sheet1" }, { key: "a" });
  const xldx2 = new Xldx([{ b: 2 }]);
  xldx2.createSheet({ name: "Sheet2" }, { key: "b" });
  const json1 = xldx.toJSON();
  const json2 = xldx2.toJSON();
  expect(json1.sheets).toHaveLength(1);
  expect(json2.sheets).toHaveLength(1);
}
function testFromJSON() {
  it("should create Xldx instance from JSON", testCreateXldxInstanceFromJSON);
  it("should handle empty sheets array", testHandleEmptySheetsArray);
  it("should handle missing sheets property", testHandleMissingSheetsProperty);
}
function testCreateXldxInstanceFromJSON() {
  const data3 = [["Header"], ["Value"]];
  const columnWidths = [20];
  const sheets2 = createXldxInstanceFromJSONSheets2(data3, columnWidths);
  const json = {
    sheets: sheets2,
  };
  const xldx = Xldx.fromJSON(json);
  expect(xldx).toBeInstanceOf(Xldx);
}
function testHandleEmptySheetsArray() {
  const sheets3: [] = [];
  const json = { sheets: sheets3 };
  const xldx = Xldx.fromJSON(json);
  expect(xldx).toBeInstanceOf(Xldx);
}
function testHandleMissingSheetsProperty() {
  const json = {};
  const xldx = Xldx.fromJSON(json);
  expect(xldx).toBeInstanceOf(Xldx);
}
function testRead() {
  it("should read XLSX data from Uint8Array", testReadXLSXDataFromUint8Array);
  it("should read XLSX data from Buffer", testReadXLSXDataFromBuffer);
}
async function testReadXLSXDataFromUint8Array() {
  const data = createReadXLSXDataFromUint8ArrayData();
  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "People" },
    { key: "name", header: "Name" },
    { key: "age", header: "Age" },
  );
  const uint8Array = await xldx.toUint8Array();
  const result = await Xldx.read(uint8Array);
  expect(result.sheets).toHaveLength(1);
  expect(result.sheets[0].name).toBe("People");
  expect(result.sheets[0].data[0]).toEqual(["Name", "Age"]);
}
async function testReadXLSXDataFromBuffer() {
  const data = [{ value: "test" }];
  const xldx = new Xldx(data);
  xldx.createSheet({ name: "Test" }, { key: "value" });
  const uint8Array = await xldx.toUint8Array();
  const buffer = Buffer.from(uint8Array);
  const result = await Xldx.read(buffer);
  expect(result.sheets).toHaveLength(1);
}
function testToUint8Array() {
  it("should generate valid XLSX as Uint8Array", testGenerateValidXLSXAsUint8Array);
}
async function testGenerateValidXLSXAsUint8Array() {
  const xldx = new Xldx([{ a: 1, b: 2 }]);
  xldx.createSheet({ name: "Test" }, { key: "a" }, { key: "b" });
  const result = await xldx.toUint8Array();
  expect(result).toBeInstanceOf(Uint8Array);
  expect(result.length).toBeGreaterThan(0);
  expect(result[0]).toBe(0x50);
  expect(result[1]).toBe(0x4b);
}
function testServerMethods() {
  it("should generate valid Buffer with toBuffer", testGenerateValidBufferWithToBuffer);
  it("should write file to disk with write method", testWriteFileToDiskWithWriteMethod);
  it("should write file using download alias", testWriteFileUsingDownloadAlias);
}
async function testGenerateValidBufferWithToBuffer() {
  const xldx = new Xldx([{ a: 1 }]);
  xldx.createSheet({ name: "Test" }, { key: "a" });
  const buffer = await xldx.toBuffer();
  expect(buffer).toBeInstanceOf(Buffer);
  expect(buffer.length).toBeGreaterThan(0);
  expect(buffer[0]).toBe(0x50);
  expect(buffer[1]).toBe(0x4b);
}
async function testWriteFileToDiskWithWriteMethod() {
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
}
async function testWriteFileUsingDownloadAlias() {
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
}
function testMultiSheetDataSheetsData() {
  it("should build sheets from SheetsData structure", testBuildSheetsFromSheetsDataStructure);
  it("should convert column data to rows correctly", testConvertColumnDataToRowsCorrectly);
  it("should handle empty column data", testHandleEmptyColumnData);
  it("should handle columns with different lengths", testHandleColumnsWithDifferentLengths);
}
function testBuildSheetsFromSheetsDataStructure() {
  const col12 = ["A", "B", "C"];
  const col22 = [1, 2, 3];
  const data4 = createBuildSheetsFromSheetsDataStructureData4(col12, col22);
  const x2 = ["X", "Y"];
  const y2 = [10, 20];
  const data5 = createBuildSheetsFromSheetsDataStructureData5(x2, y2);
  const sheets4 = createBuildSheetsFromSheetsDataStructureSheets4(data4, data5);
  const sheetsData = {
    sheets: sheets4,
  };
  const xldx = new Xldx(sheetsData);
  const sheet1 = xldx.getSheetData("Sheet1");
  const sheet2 = xldx.getSheetData("Sheet2");
  expect(sheet1.getRowsData()).toHaveLength(3);
  expect(sheet2.getRowsData()).toHaveLength(2);
}
function testConvertColumnDataToRowsCorrectly() {
  const name3 = ["Alice", "Bob"];
  const age3 = [30, 25];
  const data6 = createConvertColumnDataToRowsCorrectlyData6(name3, age3);
  const sheets5 = createConvertColumnDataToRowsCorrectlySheets5(data6);
  const sheetsData = {
    sheets: sheets5,
  };
  const xldx = new Xldx(sheetsData);
  const sheet = xldx.getSheetData("Test");
  const rows = sheet.getRowsData();
  expect(rows[0]).toEqual({ name: "Alice", age: 30 });
  expect(rows[1]).toEqual({ name: "Bob", age: 25 });
}
function testHandleEmptyColumnData() {
  const data7 = {};
  const sheets6 = createHandleEmptyColumnDataSheets6(data7);
  const sheetsData = {
    sheets: sheets6,
  };
  const xldx = new Xldx(sheetsData);
  const sheet = xldx.getSheetData("Empty");
  expect(sheet.getRowsData()).toHaveLength(0);
}
function testHandleColumnsWithDifferentLengths() {
  const short2 = ["A"];
  const long2 = ["X", "Y", "Z"];
  const data8 = createHandleColumnsWithDifferentLengthsData8(short2, long2);
  const sheets7 = createHandleColumnsWithDifferentLengthsSheets7(data8);
  const sheetsData = {
    sheets: sheets7,
  };
  const xldx = new Xldx(sheetsData);
  const sheet = xldx.getSheetData("Uneven");
  const rows = sheet.getRowsData();
  expect(rows).toHaveLength(3);
  expect(rows[0].short).toBe("A");
  expect(rows[1].short).toBeNull();
  expect(rows[2].short).toBeNull();
}
function createGetRowsDataFromASheetData() {
  const fixture = [
    { name: "Alice", age: 30, city: "NYC" },
    { name: "Bob", age: 25, city: "LA" },
    { name: "Charlie", age: 35, city: "Chicago" },
  ];
  return fixture;
}
function createGetColumnDataFromASheetData() {
  const fixture = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
    { name: "Charlie", age: 35 },
  ];
  return fixture;
}
function createGetColumnDataFromASheetFixture(name2: unknown[], age2: unknown[]) {
  const fixture: ColumnData = {
    name: name2,
    age: age2,
  };
  return fixture;
}
function createUpdateRowDataData() {
  const fixture = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ];
  return fixture;
}
function createUpdateColumnDataData() {
  const fixture = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
    { name: "Charlie", age: 35 },
  ];
  return fixture;
}
function createApplyZebraBackgroundToEvenRowsContext(
  rowData: Record<string, any>,
  allData: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 2,
    columnIndex: 0,
    value: "test",
    rowData: rowData,
    allData: allData,
    columnKey: "col1",
  };
  return fixture;
}
function createApplyZebraBackgroundToEvenRowsFill2(fgColor: string | undefined) {
  const fixture: FillStyle | undefined = {
    type: "pattern",
    pattern: "solid",
    fgColor: fgColor,
  };
  return fixture;
}
function createReturnNullForOddZebraRowsContext(
  rowData2: Record<string, any>,
  allData2: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 3,
    columnIndex: 0,
    value: "test",
    rowData: rowData2,
    allData: allData2,
    columnKey: "col1",
  };
  return fixture;
}
function createAssignDifferentColorsToDifferentValuesAllData() {
  const fixture: DataRow[] = [
    { category: "A" },
    { category: "B" },
    { category: "A" },
    { category: "C" },
  ];
  return fixture;
}
function createAssignDifferentColorsToDifferentValuesContextA(
  rowData3: Record<string, any>,
  allData: DataRow[],
) {
  const fixture: PatternContext = {
    rowIndex: 1,
    columnIndex: 0,
    value: "A",
    rowData: rowData3,
    allData,
    columnKey: "category",
  };
  return fixture;
}
function createAssignDifferentColorsToDifferentValuesContextB(
  rowData4: Record<string, any>,
  allData: DataRow[],
) {
  const fixture: PatternContext = {
    rowIndex: 2,
    columnIndex: 0,
    value: "B",
    rowData: rowData4,
    allData,
    columnKey: "category",
  };
  return fixture;
}
function createHighlightChangedTextValuesContext(
  rowData5: Record<string, any>,
  allData3: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 2,
    columnIndex: 0,
    value: "new",
    previousValue: "old",
    rowData: rowData5,
    allData: allData3,
    columnKey: "col1",
  };
  return fixture;
}
function createHighlightChangedTextValuesFont2(color2: string | undefined) {
  const fixture: FontStyle | undefined = {
    color: color2,
    bold: true,
  };
  return fixture;
}
function createApplyPatternsWhenCreatingSheetsData() {
  const fixture = [
    { name: "Alice", score: 95 },
    { name: "Bob", score: 87 },
    { name: "Charlie", score: 95 },
  ];
  return fixture;
}
function createApplyPatternsWhenCreatingSheetsFixture(patterns2: ColumnPattern | undefined) {
  const fixture: ColumnDefinition = {
    key: "name",
    header: "Name",
    patterns: patterns2,
  };
  return fixture;
}
function createApplyPatternsWhenCreatingSheetsFixture2(patterns3: ColumnPattern | undefined) {
  const fixture: ColumnDefinition = {
    key: "score",
    header: "Score",
    patterns: patterns3,
  };
  return fixture;
}
function createApplyPatternByNameOrFunctionContext(
  rowData6: Record<string, any>,
  allData4: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 2,
    columnIndex: 0,
    value: "test",
    rowData: rowData6,
    allData: allData4,
    columnKey: "col1",
  };
  return fixture;
}
function createBuildPatternContextWithProperOffsetsParams(
  rowData7: {
    col1: string;
    col2: string;
  },
  allData5: {
    col1: string;
    col2: string;
  }[],
) {
  const fixture = {
    rowIndex: 0,
    colIndex: 1,
    rowData: rowData7,
    columnKey: "col2",
    value: "B",
    allData: allData5,
  };
  return fixture;
}
function createSetACustomThemeAndReturnThisForChainingCustomTheme() {
  const fixture: ColorTheme = {
    ...defaultTheme,
    primary: "#FF0000",
  };
  return fixture;
}
function createReturnTheColumnDefinitionsUnchangedDefinitions() {
  const fixture = [
    { key: "col1", header: "Column 1" },
    { key: "col2", header: "Column 2" },
  ];
  return fixture;
}
function createMultipleSheetsAtOnceData() {
  const fixture = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ];
  return fixture;
}
function createMultipleSheetsAtOnceFixture(
  options2: SheetOptions,
  columns2: ColumnDefinition[],
  options3: SheetOptions,
  columns3: ColumnDefinition[],
) {
  const fixture = [
    {
      options: options2,
      columns: columns2,
    },
    {
      options: options3,
      columns: columns3,
    },
  ];
  return fixture;
}
function createExportWorkbookAsJSONData() {
  const fixture = [
    { name: "Alice", score: 95 },
    { name: "Bob", score: 87 },
  ];
  return fixture;
}
function createXldxInstanceFromJSONSheets2(data3: string[][], columnWidths: number[]) {
  const fixture = [
    {
      name: "TestSheet",
      data: data3,
      columnWidths: columnWidths,
    },
  ];
  return fixture;
}
function createReadXLSXDataFromUint8ArrayData() {
  const fixture = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ];
  return fixture;
}
function createBuildSheetsFromSheetsDataStructureData4(col12: string[], col22: number[]) {
  const fixture = {
    col1: col12,
    col2: col22,
  };
  return fixture;
}
function createBuildSheetsFromSheetsDataStructureData5(x2: string[], y2: number[]) {
  const fixture = {
    x: x2,
    y: y2,
  };
  return fixture;
}
function createBuildSheetsFromSheetsDataStructureSheets4(
  data4: Record<string, unknown[]>,
  data5: Record<string, unknown[]>,
) {
  const fixture = [
    {
      name: "Sheet1",
      data: data4,
    },
    {
      name: "Sheet2",
      data: data5,
    },
  ];
  return fixture;
}
function createConvertColumnDataToRowsCorrectlyData6(name3: string[], age3: number[]) {
  const fixture = {
    name: name3,
    age: age3,
  };
  return fixture;
}
function createConvertColumnDataToRowsCorrectlySheets5(data6: { name: string[]; age: number[] }) {
  const fixture = [
    {
      name: "Test",
      data: data6,
    },
  ];
  return fixture;
}
function createHandleEmptyColumnDataSheets6(data7: {}) {
  const fixture = [
    {
      name: "Empty",
      data: data7,
    },
  ];
  return fixture;
}
function createHandleColumnsWithDifferentLengthsData8(short2: string[], long2: string[]) {
  const fixture = {
    short: short2,
    long: long2,
  };
  return fixture;
}
function createHandleColumnsWithDifferentLengthsSheets7(data8: {
  short: string[];
  long: string[];
}) {
  const fixture = [
    {
      name: "Uneven",
      data: data8,
    },
  ];
  return fixture;
}
