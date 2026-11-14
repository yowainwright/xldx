import type { FillStyle, FontStyle, RowStyleOverride } from "../../../src/index";
import type { WidthCalculationOptions, CellStyleParams } from "../../../src/types";
import { describe, it, expect } from "bun:test";
import {
  zebraBg,
  bgColorBasedOnDiff,
  colorPerDiff,
  txtColorBasedOnDiff,
  createSetWidthBasedOnCharacterCount,
  customizeInput,
  applyPattern,
  buildPatternContext,
  resolveCellStyles,
  setTheme,
} from "../../../src/utils";
import { defaultTheme } from "../../../src/themes/index";
import type { PatternContext, DataRow, CellStyle, ColumnDefinition } from "../../../src/index";
describe("Pattern Functions", testPatternFunctions);
describe("Width Calculation", testWidthCalculation);
describe("customizeInput", testCustomizeInput);
describe("Pattern Application", testPatternApplication);
describe("Context and Style Utilities", testContextAndStyleUtilities);
describe("Theme Management", testThemeManagement);
it("ignores NaN when assigning colors to distinct values", testNaNColorAssignment);
it("returns null for an empty palette entry", testEmptyPaletteEntry);
it("captures width options when creating the calculator", testWidthOptionsSnapshot);

function testNaNColorAssignment() {
  const context = createColorContext([Number.NaN, "A"], "A");
  const style = bgColorBasedOnDiff(context);
  expect(style?.fill?.fgColor).toBe(defaultTheme.base[100]);
}

function testEmptyPaletteEntry() {
  const base = { ...defaultTheme.base, 100: "" };
  const theme = { ...defaultTheme, base };
  setTheme(theme);
  try {
    const context = createColorContext(["A"], "A");
    expect(bgColorBasedOnDiff(context)).toBeNull();
  } finally {
    setTheme(defaultTheme);
  }
}

function testWidthOptionsSnapshot() {
  const options = { minWidth: 10 };
  const calculator = createSetWidthBasedOnCharacterCount(["a"], options);
  options.minWidth = 50;
  const width = calculator()?.width;
  expect(width).toBe(10);
}
function testPatternFunctions() {
  describe("zebraBg", testZebraBg);
  describe("bgColorBasedOnDiff", testBgColorBasedOnDiff);
  describe("colorPerDiff", testColorPerDiff);
  describe("txtColorBasedOnDiff", testTxtColorBasedOnDiff);
}

function createColorContext(values: unknown[], value: unknown): PatternContext {
  const allData = values.map((category) => ({ category }));
  const rowData = { category: value };
  const context = {
    rowIndex: 1,
    columnIndex: 0,
    value,
    rowData,
    allData,
    columnKey: "category",
  };
  return context;
}
function testZebraBg() {
  it("should apply background to even rows", testApplyBackgroundToEvenRows);
  it("should return null for odd rows", testReturnNullForOddRows);
}
function testApplyBackgroundToEvenRows() {
  const rowData: Record<string, any> = { col1: "test" };
  const allData: Record<string, any>[] = [{ col1: "test" }];
  const context: PatternContext = createApplyBackgroundToEvenRowsContext(rowData, allData);
  const result = zebraBg(context);
  const { 100: fgColor } = defaultTheme.base;
  const fill2: FillStyle | undefined = createApplyBackgroundToEvenRowsFill2(fgColor);
  expect(result).toEqual({
    fill: fill2,
  });
}
function testReturnNullForOddRows() {
  const rowData2: Record<string, any> = { col1: "test" };
  const allData2: Record<string, any>[] = [{ col1: "test" }];
  const context: PatternContext = createReturnNullForOddRowsContext(rowData2, allData2);
  const result = zebraBg(context);
  expect(result).toBeNull();
}
function testBgColorBasedOnDiff() {
  it("should assign unique colors to unique values", testAssignUniqueColorsToUniqueValues);
  it("should return same color for same values", testReturnSameColorForSameValues);
  it("should handle null and undefined values", testHandleNullAndUndefinedValues);
}
function testAssignUniqueColorsToUniqueValues() {
  const allData: DataRow[] = createAssignUniqueColorsToUniqueValuesAllData();
  const rowData3: Record<string, any> = { category: "A" };
  const contextA: PatternContext = createCategoryContextA(rowData3, allData);
  const rowData4: Record<string, any> = { category: "B" };
  const contextB: PatternContext = createCategoryContextB(rowData4, allData);
  const rowData5: Record<string, any> = { category: "C" };
  const contextC: PatternContext = createCategoryContextC(rowData5, allData);
  const resultA = bgColorBasedOnDiff(contextA);
  const resultB = bgColorBasedOnDiff(contextB);
  const resultC = bgColorBasedOnDiff(contextC);
  expect(resultA?.fill?.fgColor).toBeDefined();
  expect(resultB?.fill?.fgColor).toBeDefined();
  expect(resultC?.fill?.fgColor).toBeDefined();
  expect(resultA?.fill?.fgColor).not.toEqual(resultB?.fill?.fgColor);
  expect(resultB?.fill?.fgColor).not.toEqual(resultC?.fill?.fgColor);
  expect(resultA?.fill?.fgColor).not.toEqual(resultC?.fill?.fgColor);
}
function testReturnSameColorForSameValues() {
  const allData: DataRow[] = [{ category: "A" }, { category: "B" }, { category: "A" }];
  const rowData6: Record<string, any> = { category: "A" };
  const context1: PatternContext = createReturnSameColorForSameValuesContext1(rowData6, allData);
  const rowData7: Record<string, any> = { category: "A" };
  const context2: PatternContext = createReturnSameColorForSameValuesContext2(rowData7, allData);
  const result1 = bgColorBasedOnDiff(context1);
  const result2 = bgColorBasedOnDiff(context2);
  expect(result1?.fill?.fgColor).toEqual(result2?.fill?.fgColor);
}
function testHandleNullAndUndefinedValues() {
  const allData: DataRow[] = [{ category: null }, { category: undefined }, { category: "A" }];
  const rowData8: Record<string, any> = { category: null };
  const contextNull: PatternContext = createHandleNullAndUndefinedValuesContextNull(
    rowData8,
    allData,
  );
  const rowData9: Record<string, any> = { category: undefined };
  const contextUndefined: PatternContext = createHandleNullAndUndefinedValuesContextUndefined(
    rowData9,
    allData,
  );
  const resultNull = bgColorBasedOnDiff(contextNull);
  const resultUndefined = bgColorBasedOnDiff(contextUndefined);
  expect(resultNull).toBeNull();
  expect(resultUndefined).toBeNull();
}
function testColorPerDiff() {
  it("should be an alias for bgColorBasedOnDiff", testBeAnAliasForBgColorBasedOnDiff);
}
function testBeAnAliasForBgColorBasedOnDiff() {
  expect(colorPerDiff).toBe(bgColorBasedOnDiff);
}
function testTxtColorBasedOnDiff() {
  it("should highlight changed values", testHighlightChangedValues);
  it("should return null for unchanged values", testReturnNullForUnchangedValues);
  it("should return null when no previous value", testReturnNullWhenNoPreviousValue);
}
function testHighlightChangedValues() {
  const rowData10: Record<string, any> = { col1: "new" };
  const allData3: Record<string, any>[] = [{ col1: "old" }, { col1: "new" }];
  const context: PatternContext = createHighlightChangedValuesContext(rowData10, allData3);
  const result = txtColorBasedOnDiff(context);
  const { primary: color2 } = defaultTheme;
  const font2: FontStyle | undefined = createHighlightChangedValuesFont2(color2);
  expect(result).toEqual({
    font: font2,
  });
}
function testReturnNullForUnchangedValues() {
  const rowData11: Record<string, any> = { col1: "same" };
  const allData4: Record<string, any>[] = [{ col1: "same" }, { col1: "same" }];
  const context: PatternContext = createReturnNullForUnchangedValuesContext(rowData11, allData4);
  const result = txtColorBasedOnDiff(context);
  expect(result).toBeNull();
}
function testReturnNullWhenNoPreviousValue() {
  const rowData12: Record<string, any> = { col1: "first" };
  const allData5: Record<string, any>[] = [{ col1: "first" }];
  const context: PatternContext = createReturnNullWhenNoPreviousValueContext(rowData12, allData5);
  const result = txtColorBasedOnDiff(context);
  expect(result).toBeNull();
}
function testWidthCalculation() {
  describe("createSetWidthBasedOnCharacterCount", testCreateSetWidthBasedOnCharacterCount);
}
function testCreateSetWidthBasedOnCharacterCount() {
  it("should calculate average width by default", testCalculateAverageWidthByDefault);
  it("should calculate max width when specified", testCalculateMaxWidthWhenSpecified);
  it("should calculate median width when specified", testCalculateMedianWidthWhenSpecified);
  it("should respect min and max width constraints", testRespectMinAndMaxWidthConstraints);
  it("should handle empty data", testHandleEmptyData);
  it("should handle null and undefined values", testHandleNullAndUndefinedValues2);
  it("should use sample size", testUseSampleSize);
  it("should apply character width multiplier", testApplyCharacterWidthMultiplier);
}
function testCalculateAverageWidthByDefault() {
  const columnData = ["short", "medium text", "long text with more characters"];
  const calculator = createSetWidthBasedOnCharacterCount(columnData);
  const result = calculator();
  expect(result).toBeDefined();
  expect(result?.width).toBeGreaterThan(10);
  expect(result?.width).toBeLessThan(100);
  expect(result?.wrapText).toBe(true);
}
function testCalculateMaxWidthWhenSpecified() {
  const columnData = ["a", "bb", "ccc", "dddd"];
  const calculator = createSetWidthBasedOnCharacterCount(columnData, { method: "max" });
  const result = calculator();
  expect(result).toBeDefined();
  expect(result?.width).toBeGreaterThanOrEqual(10);
}
function testCalculateMedianWidthWhenSpecified() {
  const columnData = ["a", "bb", "ccc", "dddd", "eeeee"];
  const calculator = createSetWidthBasedOnCharacterCount(columnData, { method: "median" });
  const result = calculator();
  expect(result).toBeDefined();
  expect(result?.width).toBeGreaterThanOrEqual(10);
}
function testRespectMinAndMaxWidthConstraints() {
  const columnData = ["x".repeat(200)];
  const calculator = createSetWidthBasedOnCharacterCount(
    columnData,
    createRespectMinAndMaxWidthConstraintsFixture(),
  );
  const result = calculator();
  expect(result?.width).toBe(50);
}
function testHandleEmptyData() {
  const columnData: unknown[] = [];
  const calculator = createSetWidthBasedOnCharacterCount(columnData);
  const result = calculator();
  expect(result).toBeNull();
}
function testHandleNullAndUndefinedValues2() {
  const columnData = [null, undefined, "", "test"];
  const calculator = createSetWidthBasedOnCharacterCount(columnData);
  const result = calculator();
  expect(result).toBeDefined();
  expect(result?.width).toBeGreaterThan(0);
}
function testUseSampleSize() {
  const columnData = Array(1000).fill("test");
  const calculator = createSetWidthBasedOnCharacterCount(columnData, { sampleSize: 10 });
  const result = calculator();
  expect(result).toBeDefined();
}
function testApplyCharacterWidthMultiplier() {
  const columnData = ["test"];
  const calculator1 = createSetWidthBasedOnCharacterCount(
    columnData,
    createApplyCharacterWidthMultiplierFixture(),
  );
  const calculator2 = createSetWidthBasedOnCharacterCount(
    columnData,
    createApplyCharacterWidthMultiplierFixture2(),
  );
  const result1 = calculator1();
  const result2 = calculator2();
  expect(result1).not.toBeNull();
  expect(result2?.width).toBeGreaterThan(result1!.width);
}
function testCustomizeInput() {
  it("should match exact string", testMatchExactString);
  it("should not match different string", testNotMatchDifferentString);
  it("should match with case insensitive fast match", testMatchWithCaseInsensitiveFastMatch);
  it("should match with regex pattern", testMatchWithRegexPattern);
}
function testMatchExactString() {
  const pattern = customizeInput("exact");
  const rowData13: Record<string, any> = { col: "exact" };
  const allData6: Record<string, any>[] = [{ col: "exact" }];
  const context: PatternContext = createMatchExactStringContext(rowData13, allData6);
  const result = pattern(context);
  const { primary: color3 } = defaultTheme.text;
  const font3: {
    color: string;
  } = { color: color3 };
  expect(result).toEqual({
    font: font3,
  });
}
function testNotMatchDifferentString() {
  const pattern = customizeInput("exact");
  const rowData14: Record<string, any> = { col: "different" };
  const allData7: Record<string, any>[] = [{ col: "different" }];
  const context: PatternContext = createNotMatchDifferentStringContext(rowData14, allData7);
  const result = pattern(context);
  expect(result).toBeNull();
}
function testMatchWithCaseInsensitiveFastMatch() {
  const pattern = customizeInput({ fastMatch: "TEST", caseSensitive: false });
  const rowData15: Record<string, any> = { col: "test" };
  const allData8: Record<string, any>[] = [{ col: "test" }];
  const context: PatternContext = createMatchWithCaseInsensitiveFastMatchContext(
    rowData15,
    allData8,
  );
  const result = pattern(context);
  const { primary: color4 } = defaultTheme.text;
  const font4: {
    color: string;
  } = { color: color4 };
  expect(result).toEqual({
    font: font4,
  });
}
function testMatchWithRegexPattern() {
  const pattern = customizeInput({ pattern: /^test\d+$/ });
  const rowData16: Record<string, any> = { col: "test123" };
  const allData9: Record<string, any>[] = [{ col: "test123" }];
  const context: PatternContext = createMatchWithRegexPatternContext(rowData16, allData9);
  const result = pattern(context);
  const { primary: color5 } = defaultTheme.text;
  const font5: {
    color: string;
  } = { color: color5 };
  expect(result).toEqual({
    font: font5,
  });
}
function testPatternApplication() {
  describe("applyPattern", testApplyPattern);
}
function testApplyPattern() {
  it("should apply built-in pattern by name", testApplyBuiltInPatternByName);
  it("should apply custom pattern", testApplyCustomPattern);
  it("should apply function pattern directly", testApplyFunctionPatternDirectly);
  it("should return null for undefined pattern", testReturnNullForUndefinedPattern);
  it("should return null for unknown pattern name", testReturnNullForUnknownPatternName);
}
function testApplyBuiltInPatternByName() {
  const rowData17: Record<string, any> = { col: "test" };
  const allData10: Record<string, any>[] = [{ col: "test" }];
  const context: PatternContext = createApplyBuiltInPatternByNameContext(rowData17, allData10);
  const result = applyPattern("zebra", context);
  expect(result).toBeDefined();
  expect(result?.fill).toBeDefined();
}
function testApplyCustomPattern() {
  const customPattern = () => {
    const font6 = { color: "#FF0000" };
    const result3 = {
      font: font6,
    };
    return result3;
  };
  const rowData18: Record<string, any> = { col: "test" };
  const allData11: Record<string, any>[] = [{ col: "test" }];
  const context: PatternContext = createApplyCustomPatternContext(rowData18, allData11);
  const result = applyPattern("myPattern", context, { myPattern: customPattern });
  const font7: FontStyle | undefined = {
    color: "#FF0000",
  };
  expect(result).toEqual({ font: font7 });
}
function testApplyFunctionPatternDirectly() {
  const pattern = () => {
    const fill3 = { fgColor: "#00FF00" };
    const result4 = {
      fill: fill3,
    };
    return result4;
  };
  const rowData19: Record<string, any> = { col: "test" };
  const allData12: Record<string, any>[] = [{ col: "test" }];
  const context: PatternContext = createApplyFunctionPatternDirectlyContext(rowData19, allData12);
  const result = applyPattern(pattern, context);
  const fill4: FillStyle | undefined = {
    fgColor: "#00FF00",
  };
  expect(result).toEqual({ fill: fill4 });
}
function testReturnNullForUndefinedPattern() {
  const rowData20: Record<string, any> = { col: "test" };
  const allData13: Record<string, any>[] = [{ col: "test" }];
  const context: PatternContext = createReturnNullForUndefinedPatternContext(rowData20, allData13);
  const result = applyPattern(undefined, context);
  expect(result).toBeNull();
}
function testReturnNullForUnknownPatternName() {
  const rowData21: Record<string, any> = { col: "test" };
  const allData14: Record<string, any>[] = [{ col: "test" }];
  const context: PatternContext = createReturnNullForUnknownPatternNameContext(
    rowData21,
    allData14,
  );
  const result = applyPattern("unknown", context);
  expect(result).toBeNull();
}
function testContextAndStyleUtilities() {
  describe("buildPatternContext", testBuildPatternContext);
  describe("resolveCellStyles", testResolveCellStyles);
}
function testBuildPatternContext() {
  it(
    "should build context with correct row index offset",
    testBuildContextWithCorrectRowIndexOffset,
  );
  it("should include previous row data when available", testIncludePreviousRowDataWhenAvailable);
  it("should handle missing previous row data", testHandleMissingPreviousRowData);
}
function testBuildContextWithCorrectRowIndexOffset() {
  const rowData22 = { col1: "A", col2: "B" };
  const allData15 = [{ col1: "A", col2: "B" }];
  const params = createBuildContextWithCorrectRowIndexOffsetParams(rowData22, allData15);
  const context = buildPatternContext(params);
  expect(context.rowIndex).toBe(2);
  expect(context.columnIndex).toBe(1);
  expect(context.value).toBe("B");
  expect(context.columnKey).toBe("col2");
  expect(context.rowData).toEqual({ col1: "A", col2: "B" });
  expect(context.allData).toEqual([{ col1: "A", col2: "B" }]);
}
function testIncludePreviousRowDataWhenAvailable() {
  const rowData23 = { col1: "B" };
  const previousRowData = { col1: "A" };
  const allData16 = [{ col1: "A" }, { col1: "B" }];
  const params = createIncludePreviousRowDataWhenAvailableParams(
    rowData23,
    previousRowData,
    allData16,
  );
  const context = buildPatternContext(params);
  expect(context.previousValue).toBe("A");
}
function testHandleMissingPreviousRowData() {
  const rowData24 = { col1: "A" };
  const allData17 = [{ col1: "A" }];
  const params = createHandleMissingPreviousRowDataParams(rowData24, allData17);
  const context = buildPatternContext(params);
  expect(context.previousValue).toBeUndefined();
}
function testResolveCellStyles() {
  it("should return column style when no default", testReturnColumnStyleWhenNoDefault);
  it("should merge default and column styles", testMergeDefaultAndColumnStyles);
  it("should override with row-specific styles", testOverrideWithRowSpecificStyles);
  it("should handle no styles", testHandleNoStyles);
}
function testReturnColumnStyleWhenNoDefault() {
  const font8: FontStyle | undefined = { bold: true };
  const style2: CellStyle | undefined = { font: font8 };
  const column: ColumnDefinition = createReturnColumnStyleWhenNoDefaultColumn(style2);
  const result = resolveCellStyles(createReturnColumnStyleWhenNoDefaultFixture(column));
  const font9: FontStyle | undefined = { bold: true };
  expect(result).toEqual({ font: font9 });
}
function testMergeDefaultAndColumnStyles() {
  const font10: FontStyle | undefined = {
    bold: true,
  };
  const style3: CellStyle | undefined = { font: font10 };
  const column: ColumnDefinition = createMergeDefaultAndColumnStylesColumn(style3);
  const font11: FontStyle | undefined = { size: 12 };
  const fill5: FillStyle | undefined = {
    fgColor: "#EEEEEE",
  };
  const defaultStyle: CellStyle = createMergeDefaultAndColumnStylesDefaultStyle(font11, fill5);
  const result = resolveCellStyles(createMergeDefaultAndColumnStylesFixture(column, defaultStyle));
  expect(result?.font?.bold).toBe(true);
  expect(result?.fill?.fgColor).toBe("#EEEEEE");
}
function testOverrideWithRowSpecificStyles() {
  const font12: FontStyle | undefined = {
    bold: true,
  };
  const style4: CellStyle | undefined = { font: font12 };
  const font13: FontStyle | undefined = {
    italic: true,
  };
  const value2: CellStyle = { font: font13 };
  const rows2: RowStyleOverride | undefined = {
    2: value2,
  };
  const column: ColumnDefinition = createOverrideWithRowSpecificStylesColumn(style4, rows2);
  const result = resolveCellStyles(createOverrideWithRowSpecificStylesFixture(column));
  const font14: FontStyle | undefined = {
    italic: true,
  };
  expect(result).toEqual({ font: font14 });
}
function testHandleNoStyles() {
  const column: ColumnDefinition = {
    key: "col1",
  };
  const result = resolveCellStyles(createHandleNoStylesFixture(column));
  expect(result).toEqual({});
}
function testThemeManagement() {
  it("should apply custom theme", testApplyCustomTheme);
}
function testApplyCustomTheme() {
  const customTheme = createApplyCustomThemeCustomTheme();
  setTheme(customTheme);
  const rowData27: Record<string, any> = { col: "new" };
  const allData19: Record<string, any>[] = [{ col: "old" }, { col: "new" }];
  const context: PatternContext = createApplyCustomThemeContext(rowData27, allData19);
  const result = txtColorBasedOnDiff(context);
  expect(result?.font?.color).toBe("#FF0000");
  setTheme(defaultTheme);
}
function createApplyBackgroundToEvenRowsContext(
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
function createApplyBackgroundToEvenRowsFill2(fgColor: string | undefined) {
  const fixture: FillStyle | undefined = {
    type: "pattern",
    pattern: "solid",
    fgColor: fgColor,
  };
  return fixture;
}
function createReturnNullForOddRowsContext(
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
function createAssignUniqueColorsToUniqueValuesAllData() {
  const fixture: DataRow[] = [
    { category: "A" },
    { category: "B" },
    { category: "C" },
    { category: "A" },
  ];
  return fixture;
}
function createCategoryContextA(rowData3: Record<string, any>, allData: DataRow[]) {
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
function createCategoryContextB(rowData4: Record<string, any>, allData: DataRow[]) {
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
function createCategoryContextC(rowData5: Record<string, any>, allData: DataRow[]) {
  const fixture: PatternContext = {
    rowIndex: 3,
    columnIndex: 0,
    value: "C",
    rowData: rowData5,
    allData,
    columnKey: "category",
  };
  return fixture;
}
function createReturnSameColorForSameValuesContext1(
  rowData6: Record<string, any>,
  allData: DataRow[],
) {
  const fixture: PatternContext = {
    rowIndex: 1,
    columnIndex: 0,
    value: "A",
    rowData: rowData6,
    allData,
    columnKey: "category",
  };
  return fixture;
}
function createReturnSameColorForSameValuesContext2(
  rowData7: Record<string, any>,
  allData: DataRow[],
) {
  const fixture: PatternContext = {
    rowIndex: 3,
    columnIndex: 0,
    value: "A",
    rowData: rowData7,
    allData,
    columnKey: "category",
  };
  return fixture;
}
function createHandleNullAndUndefinedValuesContextNull(
  rowData8: Record<string, any>,
  allData: DataRow[],
) {
  const fixture: PatternContext = {
    rowIndex: 1,
    columnIndex: 0,
    value: null,
    rowData: rowData8,
    allData,
    columnKey: "category",
  };
  return fixture;
}
function createHandleNullAndUndefinedValuesContextUndefined(
  rowData9: Record<string, any>,
  allData: DataRow[],
) {
  const fixture: PatternContext = {
    rowIndex: 2,
    columnIndex: 0,
    value: undefined,
    rowData: rowData9,
    allData,
    columnKey: "category",
  };
  return fixture;
}
function createHighlightChangedValuesContext(
  rowData10: Record<string, any>,
  allData3: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 2,
    columnIndex: 0,
    value: "new",
    previousValue: "old",
    rowData: rowData10,
    allData: allData3,
    columnKey: "col1",
  };
  return fixture;
}
function createHighlightChangedValuesFont2(color2: string | undefined) {
  const fixture: FontStyle | undefined = {
    color: color2,
    bold: true,
  };
  return fixture;
}
function createReturnNullForUnchangedValuesContext(
  rowData11: Record<string, any>,
  allData4: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 2,
    columnIndex: 0,
    value: "same",
    previousValue: "same",
    rowData: rowData11,
    allData: allData4,
    columnKey: "col1",
  };
  return fixture;
}
function createReturnNullWhenNoPreviousValueContext(
  rowData12: Record<string, any>,
  allData5: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 1,
    columnIndex: 0,
    value: "first",
    rowData: rowData12,
    allData: allData5,
    columnKey: "col1",
  };
  return fixture;
}
function createRespectMinAndMaxWidthConstraintsFixture() {
  const fixture: WidthCalculationOptions | undefined = {
    minWidth: 20,
    maxWidth: 50,
  };
  return fixture;
}
function createApplyCharacterWidthMultiplierFixture() {
  const fixture: WidthCalculationOptions | undefined = {
    charWidth: 1,
    minWidth: 5,
  };
  return fixture;
}
function createApplyCharacterWidthMultiplierFixture2() {
  const fixture: WidthCalculationOptions | undefined = {
    charWidth: 2,
    minWidth: 5,
  };
  return fixture;
}
function createMatchExactStringContext(
  rowData13: Record<string, any>,
  allData6: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 1,
    columnIndex: 0,
    value: "exact",
    rowData: rowData13,
    allData: allData6,
    columnKey: "col",
  };
  return fixture;
}
function createNotMatchDifferentStringContext(
  rowData14: Record<string, any>,
  allData7: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 1,
    columnIndex: 0,
    value: "different",
    rowData: rowData14,
    allData: allData7,
    columnKey: "col",
  };
  return fixture;
}
function createMatchWithCaseInsensitiveFastMatchContext(
  rowData15: Record<string, any>,
  allData8: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 1,
    columnIndex: 0,
    value: "test",
    rowData: rowData15,
    allData: allData8,
    columnKey: "col",
  };
  return fixture;
}
function createMatchWithRegexPatternContext(
  rowData16: Record<string, any>,
  allData9: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 1,
    columnIndex: 0,
    value: "test123",
    rowData: rowData16,
    allData: allData9,
    columnKey: "col",
  };
  return fixture;
}
function createApplyBuiltInPatternByNameContext(
  rowData17: Record<string, any>,
  allData10: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 2,
    columnIndex: 0,
    value: "test",
    rowData: rowData17,
    allData: allData10,
    columnKey: "col",
  };
  return fixture;
}
function createApplyCustomPatternContext(
  rowData18: Record<string, any>,
  allData11: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 1,
    columnIndex: 0,
    value: "test",
    rowData: rowData18,
    allData: allData11,
    columnKey: "col",
  };
  return fixture;
}
function createApplyFunctionPatternDirectlyContext(
  rowData19: Record<string, any>,
  allData12: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 1,
    columnIndex: 0,
    value: "test",
    rowData: rowData19,
    allData: allData12,
    columnKey: "col",
  };
  return fixture;
}
function createReturnNullForUndefinedPatternContext(
  rowData20: Record<string, any>,
  allData13: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 1,
    columnIndex: 0,
    value: "test",
    rowData: rowData20,
    allData: allData13,
    columnKey: "col",
  };
  return fixture;
}
function createReturnNullForUnknownPatternNameContext(
  rowData21: Record<string, any>,
  allData14: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 1,
    columnIndex: 0,
    value: "test",
    rowData: rowData21,
    allData: allData14,
    columnKey: "col",
  };
  return fixture;
}
function createBuildContextWithCorrectRowIndexOffsetParams(
  rowData22: {
    col1: string;
    col2: string;
  },
  allData15: {
    col1: string;
    col2: string;
  }[],
) {
  const fixture = {
    rowIndex: 0,
    colIndex: 1,
    rowData: rowData22,
    columnKey: "col2",
    value: "B",
    allData: allData15,
  };
  return fixture;
}
function createIncludePreviousRowDataWhenAvailableParams(
  rowData23: DataRow,
  previousRowData: DataRow,
  allData16: DataRow[],
) {
  const fixture = {
    rowIndex: 1,
    colIndex: 0,
    rowData: rowData23,
    columnKey: "col1",
    value: "B",
    previousRowData: previousRowData,
    allData: allData16,
  };
  return fixture;
}
function createHandleMissingPreviousRowDataParams(
  rowData24: {
    col1: string;
  },
  allData17: {
    col1: string;
  }[],
) {
  const fixture = {
    rowIndex: 0,
    colIndex: 0,
    rowData: rowData24,
    columnKey: "col1",
    value: "A",
    allData: allData17,
  };
  return fixture;
}
function createReturnColumnStyleWhenNoDefaultColumn(style2: CellStyle | undefined) {
  const fixture: ColumnDefinition = {
    key: "col1",
    style: style2,
  };
  return fixture;
}
function createReturnColumnStyleWhenNoDefaultFixture(column: ColumnDefinition) {
  const fixture: CellStyleParams = {
    column,
    rowIndex: 0,
  };
  return fixture;
}
function createMergeDefaultAndColumnStylesColumn(style3: CellStyle | undefined) {
  const fixture: ColumnDefinition = {
    key: "col1",
    style: style3,
  };
  return fixture;
}
function createMergeDefaultAndColumnStylesDefaultStyle(
  font11: FontStyle | undefined,
  fill5: FillStyle | undefined,
) {
  const fixture: CellStyle = {
    font: font11,
    fill: fill5,
  };
  return fixture;
}
function createMergeDefaultAndColumnStylesFixture(
  column: ColumnDefinition,
  defaultStyle: CellStyle,
) {
  const fixture: CellStyleParams = {
    column,
    rowIndex: 0,
    defaultStyle,
  };
  return fixture;
}
function createOverrideWithRowSpecificStylesColumn(
  style4: CellStyle | undefined,
  rows2: RowStyleOverride | undefined,
) {
  const fixture: ColumnDefinition = {
    key: "col1",
    style: style4,
    rows: rows2,
  };
  return fixture;
}
function createOverrideWithRowSpecificStylesFixture(column: ColumnDefinition) {
  const fixture: CellStyleParams = {
    column,
    rowIndex: 0,
  };
  return fixture;
}
function createHandleNoStylesFixture(column: ColumnDefinition) {
  const fixture: CellStyleParams = {
    column,
    rowIndex: 0,
  };
  return fixture;
}
function createApplyCustomThemeCustomTheme() {
  const fixture = {
    ...defaultTheme,
    primary: "#FF0000",
  };
  return fixture;
}
function createApplyCustomThemeContext(
  rowData27: Record<string, any>,
  allData19: Record<string, any>[],
) {
  const fixture: PatternContext = {
    rowIndex: 2,
    columnIndex: 0,
    value: "new",
    previousValue: "old",
    rowData: rowData27,
    allData: allData19,
    columnKey: "col",
  };
  return fixture;
}
