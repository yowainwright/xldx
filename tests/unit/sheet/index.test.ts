import type {
  CellStyle,
  FontStyle,
  FillStyle,
  ColumnPattern,
  PatternFunction,
} from "../../../src/index";
import type { ColumnData } from "../../../src/types";
import { describe, it, expect } from "bun:test";
import { Sheet } from "../../../src/sheet/index";
import type { ColumnDefinition, SheetOptions, DataRow } from "../../../src/index";
describe("Sheet", testSheet);
it("samples auto width before reading rows and reads plain cells once", testSampledPlainRows);
it("preserves pattern callback order and source context", testPatternOrder);
it("normalizes formulas in plain cells", testPlainFormula);

function testPatternOrder() {
  const events: unknown[][] = [];
  const bgColorPattern = recordPattern("background", events);
  const textPattern = recordPattern("text", events);
  const custom = [recordPattern("custom", events)];
  const patterns = { bgColorPattern, textPattern, custom };
  const sheet = new Sheet([{ value: 10 }, { value: 20 }], [{ key: "value", patterns }], {
    name: "Patterns",
  });
  expect(sheet.toWorksheetData().data).toEqual([["value"], [10], [20]]);
  expect(events).toEqual([
    ["background", 2, 10, undefined, true],
    ["text", 2, 10, undefined, true],
    ["custom", 2, 10, undefined, true],
    ["background", 3, 20, 10, true],
    ["text", 3, 20, 10, true],
    ["custom", 3, 20, 10, true],
  ]);
}

function recordPattern(name: string, events: unknown[][]): PatternFunction {
  const pattern: PatternFunction = (context) => {
    const { rowIndex, value, previousValue, rowData, allData } = context;
    const source = rowData === allData[rowIndex - 2];
    events[events.length] = [name, rowIndex, value, previousValue, source];
    return null;
  };
  return pattern;
}

function testPlainFormula() {
  const value = { formula: "2*3", result: 6 };
  const data = [{ value }];
  const sheet = new Sheet(data, [{ key: "value" }], { name: "Formula" });
  expect(sheet.toWorksheetData().data).toEqual([["value"], [{ formula: "2*3", result: 6 }]]);
  data[0].value.formula = "=2*3";
  expect(() => sheet.toWorksheetData()).toThrow("Invalid formula value");
}

function testSampledPlainRows() {
  let lastRowReads = 0;
  const data = Array.from({ length: 101 }, (_, index) => ({
    get value() {
      if (index === 100) lastRowReads++;
      const value = index === 100 ? "a much longer unsampled string" : "1234567890";
      return value;
    },
  }));
  const sheet = new Sheet(data, [{ key: "value", width: "auto" }], { name: "Sample" });
  const result = sheet.toWorksheetData();
  expect(result.columnWidths).toEqual([14]);
  expect(result.data[101]).toEqual(["a much longer unsampled string"]);
  expect(lastRowReads).toBe(1);
}

function testSheet() {
  describe("constructor and initialization", testConstructorAndInitialization);
  describe("getRowsData", testGetRowsData);
  describe("getColumnData", testGetColumnData);
  describe("getColData", testGetColData);
  describe("getRowData", testGetRowData);
  describe("updateRowData", testUpdateRowData);
  describe("updateColumnData", testUpdateColumnData);
  describe("getRowStyles", testGetRowStyles);
  describe("getColumnStyles", testGetColumnStyles);
  describe("updateRowStyles", testUpdateRowStyles);
  describe("updateColumnStyles", testUpdateColumnStyles);
  describe("toWorksheetData", testToWorksheetData);
  describe("getColData updateStyles callback", testGetColDataUpdateStylesCallback);
  describe("getRowData updateStyles callback", testGetRowDataUpdateStylesCallback);
}
function testConstructorAndInitialization() {
  it("should create a sheet with data and columns", testCreateASheetWithDataAndColumns);
}
function testCreateASheetWithDataAndColumns() {
  const data: DataRow[] = createASheetWithDataAndColumnsData();
  const columns: ColumnDefinition[] = createASheetWithDataAndColumnsColumns();
  const options: SheetOptions = { name: "TestSheet" };
  const sheet = new Sheet(data, columns, options);
  expect(sheet).toBeDefined();
  expect(sheet.getRowsData()).toEqual(data);
}
function testGetRowsData() {
  it("should return a copy of the data", testReturnACopyOfTheData);
}
function testReturnACopyOfTheData() {
  const data: DataRow[] = [{ id: 1 }, { id: 2 }];
  const columns: ColumnDefinition[] = [{ key: "id", header: "ID" }];
  const sheet = new Sheet(data, columns, { name: "Test" });
  const rowsData = sheet.getRowsData();
  expect(rowsData).toEqual(data);
  expect(rowsData).not.toBe(data);
}
function testGetColumnData() {
  it("should return data organized by columns", testReturnDataOrganizedByColumns);
  it("should return empty object for empty data", testReturnEmptyObjectForEmptyData);
}
function testReturnDataOrganizedByColumns() {
  const data: DataRow[] = createReturnDataOrganizedByColumnsData();
  const columns: ColumnDefinition[] = createReturnDataOrganizedByColumnsColumns();
  const sheet = new Sheet(data, columns, { name: "Test" });
  const columnData = sheet.getColumnData();
  const name2: unknown[] = ["Alice", "Bob", "Charlie"];
  const age2: unknown[] = [30, 25, 35];
  expect(columnData).toEqual(createReturnDataOrganizedByColumnsFixture(name2, age2));
}
function testReturnEmptyObjectForEmptyData() {
  const sheet = new Sheet([], [], { name: "Empty" });
  expect(sheet.getColumnData()).toEqual({});
}
function testGetColData() {
  it("should get column data by key", testGetColumnDataByKey);
  it("should get column data by index", testGetColumnDataByIndex);
  it("should throw error for invalid column", testThrowErrorForInvalidColumn);
}
function testGetColumnDataByKey() {
  const data: DataRow[] = createGetColumnDataByKeyData();
  const columns: ColumnDefinition[] = createGetColumnDataByKeyColumns();
  const sheet = new Sheet(data, columns, { name: "Test" });
  const colData = sheet.getColData("score");
  expect(colData.data).toEqual([95, 87]);
}
function testGetColumnDataByIndex() {
  const data: DataRow[] = createGetColumnDataByIndexData();
  const columns: ColumnDefinition[] = createGetColumnDataByIndexColumns();
  const sheet = new Sheet(data, columns, { name: "Test" });
  const colData = sheet.getColData(1);
  expect(colData.data).toEqual([95, 87]);
}
function testThrowErrorForInvalidColumn() {
  const sheet = new Sheet([{ a: 1 }], [{ key: "a" }], { name: "Test" });
  expect(() => {
    const result: {
      data: unknown[];
      updateStyles: (styles: CellStyle) => void;
    } = sheet.getColData("invalid");
    return result;
  }).toThrow("Column invalid not found");
  expect(() => {
    const result2: {
      data: unknown[];
      updateStyles: (styles: CellStyle) => void;
    } = sheet.getColData(5);
    return result2;
  }).toThrow("Column 5 not found");
}
function testGetRowData() {
  it("should get row data by index", testGetRowDataByIndex);
  it("should throw error for invalid row index", testThrowErrorForInvalidRowIndex);
}
function testGetRowDataByIndex() {
  const data: DataRow[] = createGetRowDataByIndexData();
  const columns: ColumnDefinition[] = createGetRowDataByIndexColumns();
  const sheet = new Sheet(data, columns, { name: "Test" });
  const rowData = sheet.getRowData(1);
  expect(rowData.data).toEqual({ name: "Bob", age: 25 });
}
function testThrowErrorForInvalidRowIndex() {
  const sheet = new Sheet([{ a: 1 }], [{ key: "a" }], { name: "Test" });
  expect(() => {
    const result3: {
      data: DataRow;
      updateStyles: (styles: CellStyle) => void;
    } = sheet.getRowData(-1);
    return result3;
  }).toThrow("Row -1 not found");
  expect(() => {
    const result4: {
      data: DataRow;
      updateStyles: (styles: CellStyle) => void;
    } = sheet.getRowData(10);
    return result4;
  }).toThrow("Row 10 not found");
}
function testUpdateRowData() {
  it("should update row data", testUpdateRowData2);
  it("should not update invalid row index", testNotUpdateInvalidRowIndex);
}
function testUpdateRowData2() {
  const data: DataRow[] = createUpdateRowData2Data();
  const columns: ColumnDefinition[] = createUpdateRowData2Columns();
  const sheet = new Sheet(data, columns, { name: "Test" });
  sheet.updateRowData(0, { age: 31 });
  const updatedData = sheet.getRowsData();
  expect(updatedData[0]).toEqual({ name: "Alice", age: 31 });
}
function testNotUpdateInvalidRowIndex() {
  const data: DataRow[] = [{ id: 1 }];
  const sheet = new Sheet(data, [{ key: "id" }], { name: "Test" });
  sheet.updateRowData(10, { id: 2 });
  expect(sheet.getRowsData()).toEqual([{ id: 1 }]);
}
function testUpdateColumnData() {
  it("should update column data", testUpdateColumnData2);
  it("should ignore invalid column key", testIgnoreInvalidColumnKey);
  it("should only update valid row indices", testOnlyUpdateValidRowIndices);
}
function testUpdateColumnData2() {
  const data: DataRow[] = createUpdateColumnData2Data();
  const columns: ColumnDefinition[] = createUpdateColumnData2Columns();
  const sheet = new Sheet(data, columns, { name: "Test" });
  sheet.updateColumnData("age", [31, 26, 36]);
  const columnData = sheet.getColumnData();
  expect(columnData.age).toEqual([31, 26, 36]);
}
function testIgnoreInvalidColumnKey() {
  const data: DataRow[] = [{ id: 1 }];
  const sheet = new Sheet(data, [{ key: "id" }], { name: "Test" });
  sheet.updateColumnData("invalid", [2]);
  expect(sheet.getRowsData()).toEqual([{ id: 1 }]);
}
function testOnlyUpdateValidRowIndices() {
  const data: DataRow[] = [{ id: 1 }, { id: 2 }];
  const sheet = new Sheet(data, [{ key: "id" }], { name: "Test" });
  sheet.updateColumnData("id", [10, 20, 30, 40]);
  expect(sheet.getRowsData()).toEqual([{ id: 10 }, { id: 20 }]);
}
function testGetRowStyles() {
  it("should return empty object when no index provided", testReturnEmptyObjectWhenNoIndexProvided);
  it("should return styles for specific row", testReturnStylesForSpecificRow);
}
function testReturnEmptyObjectWhenNoIndexProvided() {
  const sheet = new Sheet([{ a: 1 }], [{ key: "a" }], { name: "Test" });
  expect(sheet.getRowStyles()).toEqual({});
}
function testReturnStylesForSpecificRow() {
  const font2: FontStyle | undefined = { bold: true };
  const style2: CellStyle | undefined = {
    font: font2,
  };
  const columns: ColumnDefinition[] = createReturnStylesForSpecificRowColumns(style2);
  const font3: FontStyle | undefined = { size: 12 };
  const defaultStyle: CellStyle | undefined = {
    font: font3,
  };
  const sheet = new Sheet(
    [{ a: 1 }],
    columns,
    createReturnStylesForSpecificRowFixture(defaultStyle),
  );
  const styles = sheet.getRowStyles(0);
  expect(styles).toHaveProperty("font");
}
function testGetColumnStyles() {
  it("should return empty object when no key provided", testReturnEmptyObjectWhenNoKeyProvided);
  it("should return column styles", testReturnColumnStyles);
  it("should return empty object for invalid column", testReturnEmptyObjectForInvalidColumn);
}
function testReturnEmptyObjectWhenNoKeyProvided() {
  const sheet = new Sheet([{ a: 1 }], [{ key: "a" }], { name: "Test" });
  expect(sheet.getColumnStyles()).toEqual({});
}
function testReturnColumnStyles() {
  const font4: FontStyle | undefined = { bold: true };
  const style3: CellStyle | undefined = {
    font: font4,
  };
  const columns: ColumnDefinition[] = createReturnColumnStylesColumns(style3);
  const sheet = new Sheet([{ a: 1 }], columns, { name: "Test" });
  const styles = sheet.getColumnStyles("a");
  const font5: FontStyle | undefined = { bold: true };
  expect(styles).toEqual({ font: font5 });
}
function testReturnEmptyObjectForInvalidColumn() {
  const sheet = new Sheet([{ a: 1 }], [{ key: "a" }], { name: "Test" });
  expect(sheet.getColumnStyles("invalid")).toEqual({});
}
function testUpdateRowStyles() {
  it("should update row styles", testUpdateRowStyles2);
  it("should not update invalid row index", testNotUpdateInvalidRowIndex2);
}
function testUpdateRowStyles2() {
  const columns: ColumnDefinition[] = [{ key: "a" }, { key: "b" }];
  const sheet = new Sheet([{ a: 1, b: 2 }], columns, { name: "Test" });
  const font6: FontStyle | undefined = {
    italic: true,
  };
  sheet.updateRowStyles(0, { font: font6 });
  const styles = sheet.getRowStyles(0);
  expect(styles).toBeDefined();
}
function testNotUpdateInvalidRowIndex2() {
  const sheet = new Sheet([{ a: 1 }], [{ key: "a" }], { name: "Test" });
  const font7: FontStyle | undefined = { bold: true };
  sheet.updateRowStyles(10, { font: font7 });
}
function testUpdateColumnStyles() {
  it("should update column styles", testUpdateColumnStyles2);
  it("should not update invalid column", testNotUpdateInvalidColumn);
}
function testUpdateColumnStyles2() {
  const fill2: FillStyle | undefined = {
    fgColor: "#FF0000",
  };
  const style4: CellStyle | undefined = {
    fill: fill2,
  };
  const columns: ColumnDefinition[] = createUpdateColumnStyles2Columns(style4);
  const sheet = new Sheet([{ a: 1 }], columns, { name: "Test" });
  const font8: FontStyle | undefined = { bold: true };
  sheet.updateColumnStyles("a", { font: font8 });
  const styles = sheet.getColumnStyles("a");
  const fill3: FillStyle | undefined = {
    fgColor: "#FF0000",
  };
  const font9: FontStyle | undefined = { bold: true };
  expect(styles).toEqual(createUpdateColumnStyles2Fixture(fill3, font9));
}
function testNotUpdateInvalidColumn() {
  const sheet = new Sheet([{ a: 1 }], [{ key: "a" }], { name: "Test" });
  const font10: FontStyle | undefined = {
    bold: true,
  };
  sheet.updateColumnStyles("invalid", { font: font10 });
}
function testToWorksheetData() {
  it("should generate worksheet data with headers", testGenerateWorksheetDataWithHeaders);
  it("should include column widths for numeric widths", testIncludeColumnWidthsForNumericWidths);
  it("should calculate auto widths", testCalculateAutoWidths);
  it("should apply patterns during data processing", testApplyPatternsDuringDataProcessing);
  it("should apply custom pattern functions", testApplyCustomPatternFunctions);
}
function testGenerateWorksheetDataWithHeaders() {
  const data: DataRow[] = createGenerateWorksheetDataWithHeadersData();
  const columns: ColumnDefinition[] = createGenerateWorksheetDataWithHeadersColumns();
  const sheet = new Sheet(data, columns, { name: "Test" });
  const worksheetData = sheet.toWorksheetData();
  expect(worksheetData.data[0]).toEqual(["Name", "Age"]);
  expect(worksheetData.data[1]).toEqual(["Alice", 30]);
  expect(worksheetData.data[2]).toEqual(["Bob", 25]);
}
function testIncludeColumnWidthsForNumericWidths() {
  const columns: ColumnDefinition[] = createIncludeColumnWidthsForNumericWidthsColumns();
  const sheet = new Sheet([{ a: 1, b: 2 }], columns, { name: "Test" });
  const worksheetData = sheet.toWorksheetData();
  expect(worksheetData.columnWidths).toEqual([100, 200]);
}
function testCalculateAutoWidths() {
  const columns: ColumnDefinition[] = createCalculateAutoWidthsColumns();
  const data = [{ short: "a", long: "this is a very long text" }];
  const sheet = new Sheet(data, columns, { name: "Test" });
  const worksheetData = sheet.toWorksheetData();
  expect(worksheetData.columnWidths).toBeDefined();
  expect(worksheetData.columnWidths![0]).toBeLessThan(worksheetData.columnWidths![1]);
}
function testApplyPatternsDuringDataProcessing() {
  const data: DataRow[] = [{ value: "A" }, { value: "B" }, { value: "A" }];
  const patterns2: ColumnPattern | undefined = {
    bgColorPattern: "colorPerDiff",
  };
  const columns: ColumnDefinition[] = createApplyPatternsDuringDataProcessingColumns(patterns2);
  const sheet = new Sheet(data, columns, { name: "Test" });
  const worksheetData = sheet.toWorksheetData();
  expect(worksheetData.data).toHaveLength(4);
  expect(worksheetData.data[0]).toEqual(["Value"]);
}
function testApplyCustomPatternFunctions() {
  const customPattern = () => {
    const fill4 = { fgColor: "#FF0000" };
    const result5 = { fill: fill4 };
    return result5;
  };
  const data: DataRow[] = [{ val: 1 }, { val: 2 }];
  const custom2: (string | PatternFunction)[] | undefined =
    createApplyCustomPatternFunctionsCustom2(customPattern);
  const patterns3: ColumnPattern | undefined = {
    custom: custom2,
  };
  const columns: ColumnDefinition[] = createApplyCustomPatternFunctionsColumns(patterns3);
  const sheet = new Sheet(data, columns, { name: "CustomPatterns" });
  const worksheetData = sheet.toWorksheetData();
  expect(worksheetData.data).toHaveLength(3);
}
function testGetColDataUpdateStylesCallback() {
  it("should update column styles via callback", testUpdateColumnStylesViaCallback);
}
function testUpdateColumnStylesViaCallback() {
  const data: DataRow[] = [{ score: 100 }, { score: 200 }];
  const columns: ColumnDefinition[] = createUpdateColumnStylesViaCallbackColumns();
  const sheet = new Sheet(data, columns, { name: "Callback" });
  const colData = sheet.getColData("score");
  const font11: FontStyle | undefined = {
    bold: true,
  };
  colData.updateStyles({ font: font11 });
  const styles = sheet.getColumnStyles("score");
  expect(styles.font?.bold).toBe(true);
}
function testGetRowDataUpdateStylesCallback() {
  it("should update row styles via callback", testUpdateRowStylesViaCallback);
}
function testUpdateRowStylesViaCallback() {
  const data: DataRow[] = [{ a: 1 }, { a: 2 }];
  const columns: ColumnDefinition[] = [{ key: "a" }];
  const sheet = new Sheet(data, columns, { name: "RowCallback" });
  const rowData = sheet.getRowData(0);
  const fill5: FillStyle | undefined = {
    fgColor: "#00FF00",
  };
  rowData.updateStyles({ fill: fill5 });
  const styles = sheet.getRowStyles(0);
  expect(styles).toBeDefined();
}
function createASheetWithDataAndColumnsData() {
  const fixture: DataRow[] = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ];
  return fixture;
}
function createASheetWithDataAndColumnsColumns() {
  const fixture: ColumnDefinition[] = [
    { key: "name", header: "Name" },
    { key: "age", header: "Age" },
  ];
  return fixture;
}
function createReturnDataOrganizedByColumnsData() {
  const fixture: DataRow[] = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
    { name: "Charlie", age: 35 },
  ];
  return fixture;
}
function createReturnDataOrganizedByColumnsColumns() {
  const fixture: ColumnDefinition[] = [
    { key: "name", header: "Name" },
    { key: "age", header: "Age" },
  ];
  return fixture;
}
function createReturnDataOrganizedByColumnsFixture(name2: unknown[], age2: unknown[]) {
  const fixture: ColumnData = {
    name: name2,
    age: age2,
  };
  return fixture;
}
function createGetColumnDataByKeyData() {
  const fixture: DataRow[] = [
    { name: "Alice", score: 95 },
    { name: "Bob", score: 87 },
  ];
  return fixture;
}
function createGetColumnDataByKeyColumns() {
  const fixture: ColumnDefinition[] = [
    { key: "name", header: "Name" },
    { key: "score", header: "Score" },
  ];
  return fixture;
}
function createGetColumnDataByIndexData() {
  const fixture: DataRow[] = [
    { name: "Alice", score: 95 },
    { name: "Bob", score: 87 },
  ];
  return fixture;
}
function createGetColumnDataByIndexColumns() {
  const fixture: ColumnDefinition[] = [
    { key: "name", header: "Name" },
    { key: "score", header: "Score" },
  ];
  return fixture;
}
function createGetRowDataByIndexData() {
  const fixture: DataRow[] = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ];
  return fixture;
}
function createGetRowDataByIndexColumns() {
  const fixture: ColumnDefinition[] = [
    { key: "name", header: "Name" },
    { key: "age", header: "Age" },
  ];
  return fixture;
}
function createUpdateRowData2Data() {
  const fixture: DataRow[] = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ];
  return fixture;
}
function createUpdateRowData2Columns() {
  const fixture: ColumnDefinition[] = [
    { key: "name", header: "Name" },
    { key: "age", header: "Age" },
  ];
  return fixture;
}
function createUpdateColumnData2Data() {
  const fixture: DataRow[] = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
    { name: "Charlie", age: 35 },
  ];
  return fixture;
}
function createUpdateColumnData2Columns() {
  const fixture: ColumnDefinition[] = [
    { key: "name", header: "Name" },
    { key: "age", header: "Age" },
  ];
  return fixture;
}
function createReturnStylesForSpecificRowColumns(style2: CellStyle | undefined) {
  const fixture: ColumnDefinition[] = [
    {
      key: "a",
      style: style2,
    },
  ];
  return fixture;
}
function createReturnStylesForSpecificRowFixture(defaultStyle: CellStyle | undefined) {
  const fixture: SheetOptions = {
    name: "Test",
    defaultStyle: defaultStyle,
  };
  return fixture;
}
function createReturnColumnStylesColumns(style3: CellStyle | undefined) {
  const fixture: ColumnDefinition[] = [
    {
      key: "a",
      style: style3,
    },
  ];
  return fixture;
}
function createUpdateColumnStyles2Columns(style4: CellStyle | undefined) {
  const fixture: ColumnDefinition[] = [
    {
      key: "a",
      style: style4,
    },
  ];
  return fixture;
}
function createUpdateColumnStyles2Fixture(
  fill3: FillStyle | undefined,
  font9: FontStyle | undefined,
) {
  const fixture: CellStyle = {
    fill: fill3,
    font: font9,
  };
  return fixture;
}
function createGenerateWorksheetDataWithHeadersData() {
  const fixture: DataRow[] = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ];
  return fixture;
}
function createGenerateWorksheetDataWithHeadersColumns() {
  const fixture: ColumnDefinition[] = [
    { key: "name", header: "Name" },
    { key: "age", header: "Age" },
  ];
  return fixture;
}
function createIncludeColumnWidthsForNumericWidthsColumns() {
  const fixture: ColumnDefinition[] = [
    { key: "a", width: 100 },
    { key: "b", width: 200 },
  ];
  return fixture;
}
function createCalculateAutoWidthsColumns() {
  const fixture: ColumnDefinition[] = [
    { key: "short", width: "auto" },
    { key: "long", width: "auto" },
  ];
  return fixture;
}
function createApplyPatternsDuringDataProcessingColumns(patterns2: ColumnPattern | undefined) {
  const fixture: ColumnDefinition[] = [
    {
      key: "value",
      header: "Value",
      patterns: patterns2,
    },
  ];
  return fixture;
}
function createApplyCustomPatternFunctionsCustom2(
  customPattern: () => {
    fill: {
      fgColor: string;
    };
  },
) {
  const fixture: (string | PatternFunction)[] | undefined = [customPattern, "zebra"];
  return fixture;
}
function createApplyCustomPatternFunctionsColumns(patterns3: ColumnPattern | undefined) {
  const fixture: ColumnDefinition[] = [
    {
      key: "val",
      header: "Val",
      patterns: patterns3,
    },
  ];
  return fixture;
}
function createUpdateColumnStylesViaCallbackColumns() {
  const fixture: ColumnDefinition[] = [
    {
      key: "score",
      header: "Score",
    },
  ];
  return fixture;
}
