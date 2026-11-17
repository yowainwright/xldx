import type { ColumnPattern, ColumnDefinition } from "../../../src/index";
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Xldx } from "../../../src/server/index";
import * as fs from "fs/promises";
import { mkdirSync, rmSync } from "node:fs";
import * as path from "path";
class OffsetArchive extends Xldx {
  bufferCalls = 0;

  override async toUint8Array(): Promise<Uint8Array<ArrayBuffer>> {
    const bytes = Uint8Array.of(99, 80, 75, 88).subarray(1, 3);
    return bytes;
  }

  override async toBuffer(): Promise<Buffer> {
    this.bufferCalls++;
    const buffer = await super.toBuffer();
    return buffer;
  }
}
const TEST_OUTPUT_DIR = path.join(import.meta.dir, "output");
describe("Node.js Integration Tests", testNodeJsIntegrationTests);
function testNodeJsIntegrationTests() {
  beforeAll(() => {
    mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
  });
  afterAll(() => {
    rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  });
  describe("End-to-end XLSX generation", testEndToEndXLSXGeneration);
  describe("toBuffer", testToBuffer);
  describe("write method", testWriteMethod);
  describe("SheetsData format", testSheetsDataFormat);
  describe("Roundtrip: generate -> read -> verify", testRoundtripGenerateReadVerify);
}
function testEndToEndXLSXGeneration() {
  it(
    "should generate a valid XLSX file with simple data",
    testGenerateAValidXLSXFileWithSimpleData,
  );
  it("should generate XLSX with multiple sheets", testGenerateXLSXWithMultipleSheets);
  it("should generate XLSX with patterns applied", testGenerateXLSXWithPatternsApplied);
  it("should generate XLSX with auto column widths", testGenerateXLSXWithAutoColumnWidths);
  it("should handle special characters in data", testHandleSpecialCharactersInData);
  it("should handle various data types", testHandleVariousDataTypes);
  it("should handle large datasets", testHandleLargeDatasets);
}
async function testGenerateAValidXLSXFileWithSimpleData() {
  const data = createGenerateAValidXLSXFileWithSimpleDataData();
  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "People" },
    { key: "name", header: "Name" },
    { key: "age", header: "Age" },
    { key: "city", header: "City" },
  );
  const filePath = path.join(TEST_OUTPUT_DIR, "simple.xlsx");
  await xldx.write(filePath);
  const stats = await fs.stat(filePath);
  expect(stats.size).toBeGreaterThan(0);
  const fileData = await fs.readFile(filePath);
  const result = await Xldx.read(fileData);
  expect(result.sheets).toHaveLength(1);
  expect(result.sheets[0].name).toBe("People");
  expect(result.sheets[0].data[0]).toEqual(["Name", "Age", "City"]);
  expect(result.sheets[0].data[1]).toEqual(["Alice", 30, "New York"]);
}
async function testGenerateXLSXWithMultipleSheets() {
  const xldx = new Xldx([{ id: 1 }]);
  xldx.createSheet({ name: "Sheet1" }, { key: "id", header: "ID" });
  const xldx2 = new Xldx([{ value: "test" }]);
  xldx2.createSheet({ name: "Data" }, { key: "value", header: "Value" });
  const filePath1 = path.join(TEST_OUTPUT_DIR, "multi1.xlsx");
  const filePath2 = path.join(TEST_OUTPUT_DIR, "multi2.xlsx");
  await xldx.write(filePath1);
  await xldx2.write(filePath2);
  const result1 = await Xldx.read(await fs.readFile(filePath1));
  const result2 = await Xldx.read(await fs.readFile(filePath2));
  expect(result1.sheets[0].name).toBe("Sheet1");
  expect(result2.sheets[0].name).toBe("Data");
}
async function testGenerateXLSXWithPatternsApplied() {
  const data = createGenerateXLSXWithPatternsAppliedData();
  const xldx = new Xldx(data);
  const patterns2: ColumnPattern | undefined = {
    bgColorPattern: "colorPerDiff",
  };
  const patterns3: ColumnPattern | undefined = {
    bgColorPattern: "zebra",
  };
  xldx.createSheet(
    { name: "Patterns" },
    createGenerateXLSXWithPatternsAppliedFixture(patterns2),
    createGenerateXLSXWithPatternsAppliedFixture2(patterns3),
  );
  const filePath = path.join(TEST_OUTPUT_DIR, "patterns.xlsx");
  await xldx.write(filePath);
  const stats = await fs.stat(filePath);
  expect(stats.size).toBeGreaterThan(0);
}
async function testGenerateXLSXWithAutoColumnWidths() {
  const data = createGenerateXLSXWithAutoColumnWidthsData();
  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "Widths" },
    { key: "short", header: "Short", width: "auto" },
    { key: "long", header: "Long Column", width: "auto" },
  );
  const filePath = path.join(TEST_OUTPUT_DIR, "widths.xlsx");
  await xldx.write(filePath);
  const stats = await fs.stat(filePath);
  expect(stats.size).toBeGreaterThan(0);
}
async function testHandleSpecialCharactersInData() {
  const data = createHandleSpecialCharactersInDataData();
  const xldx = new Xldx(data);
  xldx.createSheet({ name: "Special" }, { key: "text", header: "Text" });
  const filePath = path.join(TEST_OUTPUT_DIR, "special.xlsx");
  await xldx.write(filePath);
  const result = await Xldx.read(await fs.readFile(filePath));
  expect(result.sheets[0].data[1][0]).toBe("<xml>content</xml>");
  expect(result.sheets[0].data[4][0]).toBe("Unicode: 日本語 한국어 🎉");
}
async function testHandleVariousDataTypes() {
  const float2 = -1.5;
  const data = createHandleVariousDataTypesData(float2);
  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "Types" },
    { key: "string", header: "String" },
    { key: "number", header: "Number" },
    { key: "float", header: "Float" },
    { key: "bool", header: "Boolean" },
  );
  const filePath = path.join(TEST_OUTPUT_DIR, "types.xlsx");
  await xldx.write(filePath);
  const result = await Xldx.read(await fs.readFile(filePath));
  expect(result.sheets[0].data[1][0]).toBe("text");
  expect(result.sheets[0].data[1][1]).toBe(123);
  expect(result.sheets[0].data[1][3]).toBe(true);
  expect(result.sheets[0].data[2][3]).toBe(false);
}
async function testHandleLargeDatasets() {
  const data = Array.from({ length: 1000 }, (_, index) => createLargeDatasetRow(index));
  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "LargeData" },
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "score", header: "Score" },
  );
  const filePath = path.join(TEST_OUTPUT_DIR, "large.xlsx");
  await xldx.write(filePath);
  const stats = await fs.stat(filePath);
  expect(stats.size).toBeGreaterThan(10000);
  const result = await Xldx.read(await fs.readFile(filePath));
  expect(result.sheets[0].data.length).toBe(1001);
}
function createLargeDatasetRow(index: number) {
  const id = index + 1;
  const name = `User ${id}`;
  const email = `user${id}@example.com`;
  const score = Math.random() * 100;
  const row = createHandleLargeDatasetsResult3(id, name, email, score);
  return row;
}
function testToBuffer() {
  it("should return a valid Buffer", testReturnAValidBuffer);
  it("copies only the visible bytes of an offset view", async () => {
    const book = new OffsetArchive([]);
    const buffer = await book.toBuffer();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(Array.from(buffer)).toEqual([80, 75]);
  });
}
async function testReturnAValidBuffer() {
  const xldx = new Xldx([{ a: 1 }]);
  xldx.createSheet({ name: "Test" }, { key: "a" });
  const buffer = await xldx.toBuffer();
  expect(buffer).toBeInstanceOf(Buffer);
  expect(buffer.length).toBeGreaterThan(0);
  expect(buffer[0]).toBe(0x50);
  expect(buffer[1]).toBe(0x4b);
}
function testWriteMethod() {
  it("should write file to disk", testWriteFileToDisk);
  it("writes only visible bytes without copying through toBuffer", testWriteOffset);
  it("propagates write failures for an unavailable parent", testRejectWrite);
}
async function testWriteOffset() {
  const book = new OffsetArchive([]);
  const file = path.join(TEST_OUTPUT_DIR, "offset.xlsx");
  await book.write(file);
  const bytes = await fs.readFile(file);
  expect(Array.from(bytes)).toEqual([80, 75]);
  expect(book.bufferCalls).toBe(0);
}
async function testRejectWrite() {
  const book = new OffsetArchive([]);
  const file = path.join(TEST_OUTPUT_DIR, "absent", "archive.xlsx");
  await expect(book.write(file)).rejects.toThrow("ENOENT");
}
async function testWriteFileToDisk() {
  const xldx = new Xldx([{ test: "value" }]);
  xldx.createSheet({ name: "WriteTest" }, { key: "test" });
  const filePath = path.join(TEST_OUTPUT_DIR, "write-test.xlsx");
  await xldx.write(filePath);
  const stats = await fs.stat(filePath);
  expect(stats.size).toBeGreaterThan(0);
}
function testSheetsDataFormat() {
  it("should generate XLSX from column-based data", testGenerateXLSXFromColumnBasedData);
}
async function testGenerateXLSXFromColumnBasedData() {
  const name3 = ["Alice", "Bob", "Charlie"];
  const score3 = [95, 87, 92];
  const data2 = createGenerateXLSXFromColumnBasedDataData2(name3, score3);
  const sheets2 = createGenerateXLSXFromColumnBasedDataSheets2(data2);
  const sheetsData = {
    sheets: sheets2,
  };
  const xldx = new Xldx(sheetsData);
  const filePath = path.join(TEST_OUTPUT_DIR, "column-data.xlsx");
  await xldx.write(filePath);
  const result = await Xldx.read(await fs.readFile(filePath));
  expect(result.sheets[0].data[1]).toEqual(["Alice", 95]);
  expect(result.sheets[0].data[2]).toEqual(["Bob", 87]);
}
function testRoundtripGenerateReadVerify() {
  it("should preserve all data through write/read cycle", testPreserveAllDataThroughWriteReadCycle);
}
async function testPreserveAllDataThroughWriteReadCycle() {
  const originalData = createPreserveAllDataThroughWriteReadCycleOriginalData();
  const xldx = new Xldx(originalData);
  xldx.createSheet(
    { name: "Roundtrip" },
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    { key: "active", header: "Active" },
    { key: "score", header: "Score" },
  );
  const filePath = path.join(TEST_OUTPUT_DIR, "roundtrip.xlsx");
  await xldx.write(filePath);
  const fileData = await fs.readFile(filePath);
  const result = await Xldx.read(fileData);
  expect(result.sheets[0].data[0]).toEqual(["ID", "Name", "Active", "Score"]);
  expect(result.sheets[0].data[1]).toEqual([1, "Test 1", true, 95.5]);
  expect(result.sheets[0].data[2]).toEqual([2, "Test 2", false, 87.3]);
  expect(result.sheets[0].data[3]).toEqual([3, "Test 3", true, 92.1]);
}
function createGenerateAValidXLSXFileWithSimpleDataData() {
  const fixture = [
    { name: "Alice", age: 30, city: "New York" },
    { name: "Bob", age: 25, city: "Los Angeles" },
    { name: "Charlie", age: 35, city: "Chicago" },
  ];
  return fixture;
}
function createGenerateXLSXWithPatternsAppliedData() {
  const fixture = [
    { category: "A", value: 100 },
    { category: "B", value: 200 },
    { category: "A", value: 150 },
    { category: "C", value: 300 },
  ];
  return fixture;
}
function createGenerateXLSXWithPatternsAppliedFixture(patterns2: ColumnPattern | undefined) {
  const fixture: ColumnDefinition = {
    key: "category",
    header: "Category",
    patterns: patterns2,
  };
  return fixture;
}
function createGenerateXLSXWithPatternsAppliedFixture2(patterns3: ColumnPattern | undefined) {
  const fixture: ColumnDefinition = {
    key: "value",
    header: "Value",
    patterns: patterns3,
  };
  return fixture;
}
function createGenerateXLSXWithAutoColumnWidthsData() {
  const fixture = [
    { short: "A", long: "This is a very long text that should affect column width" },
    { short: "B", long: "Another long text" },
  ];
  return fixture;
}
function createHandleSpecialCharactersInDataData() {
  const fixture = [
    { text: "<xml>content</xml>" },
    { text: "Quotes: \"double\" and 'single'" },
    { text: "Ampersand: A & B" },
    { text: "Unicode: 日本語 한국어 🎉" },
  ];
  return fixture;
}
function createHandleVariousDataTypesData(float2: -1.5) {
  const fixture = [
    { string: "text", number: 123, float: 45.67, bool: true },
    { string: "", number: 0, float: float2, bool: false },
    { string: "null check", number: null, float: undefined, bool: null },
  ];
  return fixture;
}
function createHandleLargeDatasetsResult3(
  id2: number,
  name2: string,
  email2: string,
  score2: number,
) {
  const fixture: {
    id: number;
    name: string;
    email: string;
    score: number;
  } = {
    id: id2,
    name: name2,
    email: email2,
    score: score2,
  };
  return fixture;
}
function createGenerateXLSXFromColumnBasedDataData2(name3: string[], score3: number[]) {
  const fixture = {
    name: name3,
    score: score3,
  };
  return fixture;
}
function createGenerateXLSXFromColumnBasedDataSheets2(data2: { name: string[]; score: number[] }) {
  const fixture = [
    {
      name: "ColumnData",
      data: data2,
    },
  ];
  return fixture;
}
function createPreserveAllDataThroughWriteReadCycleOriginalData() {
  const fixture = [
    { id: 1, name: "Test 1", active: true, score: 95.5 },
    { id: 2, name: "Test 2", active: false, score: 87.3 },
    { id: 3, name: "Test 3", active: true, score: 92.1 },
  ];
  return fixture;
}
