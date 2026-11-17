import { describe, it, expect, setSystemTime } from "bun:test";
import { MiniZip, MiniUnzip } from "../../../src/zip/index";

const EXPECTED_ARCHIVE =
  "504b0304140000000000000021588b9ed9d3010000000100000005000000612e74787441504b01021400140000000000000021588b9ed9d30100000001000000050000000000000000000000000000000000612e747874504b0506000000000100010033000000240000000000";

it("preserves the original ZIP record bytes", testOriginalRecordBytes);
it.each([
  ["ASCII vector", "123456789", 0xcbf43926],
  ["empty payload", "", 0],
  ["offset view", new TextEncoder().encode("x123456789y").subarray(1, 10), 0xcbf43926],
])("writes the independent CRC-32 for %s to both headers", (_, content, expected) => {
  const zip = new MiniZip();
  zip.addFile("data", content);
  const bytes = zip.generate();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const endOffset = bytes.length - 22;
  const centralOffset = view.getUint32(endOffset + 16, true);
  expect(view.getUint32(14, true)).toBe(expected);
  expect(view.getUint32(centralOffset + 16, true)).toBe(expected);
  const unzip = new MiniUnzip(bytes);
  expect(unzip.getFile("data")).toBe(typeof content === "string" ? content : "123456789");
});
describe("MiniZip", testMiniZip);
describe("MiniUnzip", testMiniUnzip);
describe("MiniZip/MiniUnzip roundtrip", testMiniZipMiniUnzipRoundtrip);
function testOriginalRecordBytes() {
  setSystemTime(new Date(2024, 0, 1));
  try {
    const zip = new MiniZip();
    zip.addFile("a.txt", "A");
    const bytes = zip.generate();
    const hex = Buffer.from(bytes).toString("hex");
    expect(hex).toBe(EXPECTED_ARCHIVE);
  } finally {
    setSystemTime();
  }
}

function testMiniZip() {
  describe("addFile", testAddFile);
  describe("generate", testGenerate);
}
function testAddFile() {
  it("should add a string file", testAddAStringFile);
  it("should add a Uint8Array file", testAddAUint8ArrayFile);
  it("should add multiple files", testAddMultipleFiles);
  it("should handle nested paths", testHandleNestedPaths);
  it("should handle empty content", testHandleEmptyContent);
  it("should handle unicode content", testHandleUnicodeContent);
}
function testAddAStringFile() {
  const zip = new MiniZip();
  zip.addFile("test.txt", "Hello, World!");
  const data = zip.generate();
  expect(data).toBeInstanceOf(Uint8Array);
  expect(data.length).toBeGreaterThan(0);
}
function testAddAUint8ArrayFile() {
  const zip = new MiniZip();
  const content = new Uint8Array([72, 101, 108, 108, 111]);
  zip.addFile("binary.bin", content);
  const data = zip.generate();
  expect(data).toBeInstanceOf(Uint8Array);
}
function testAddMultipleFiles() {
  const zip = new MiniZip();
  zip.addFile("file1.txt", "Content 1");
  zip.addFile("file2.txt", "Content 2");
  zip.addFile("file3.txt", "Content 3");
  const data = zip.generate();
  expect(data.length).toBeGreaterThan(0);
}
function testHandleNestedPaths() {
  const zip = new MiniZip();
  zip.addFile("folder/subfolder/file.txt", "Nested content");
  const data = zip.generate();
  expect(data.length).toBeGreaterThan(0);
}
function testHandleEmptyContent() {
  const zip = new MiniZip();
  zip.addFile("empty.txt", "");
  const data = zip.generate();
  expect(data.length).toBeGreaterThan(0);
}
function testHandleUnicodeContent() {
  const zip = new MiniZip();
  zip.addFile("unicode.txt", "Hello 世界 🌍");
  const data = zip.generate();
  expect(data.length).toBeGreaterThan(0);
}
function testGenerate() {
  it("should generate valid ZIP signature", testGenerateValidZIPSignature);
  it("should include central directory", testIncludeCentralDirectory);
  it("should include end of central directory", testIncludeEndOfCentralDirectory);
  it("should handle large files", testHandleLargeFiles);
  it("should generate empty ZIP when no files added", testGenerateEmptyZIPWhenNoFilesAdded);
}
function testGenerateValidZIPSignature() {
  const zip = new MiniZip();
  zip.addFile("test.txt", "test");
  const data = zip.generate();
  expect(data[0]).toBe(0x50);
  expect(data[1]).toBe(0x4b);
  expect(data[2]).toBe(0x03);
  expect(data[3]).toBe(0x04);
}
function testIncludeCentralDirectory() {
  const zip = new MiniZip();
  zip.addFile("test.txt", "test content");
  const data = zip.generate();
  let foundCentralDir = false;
  for (let i = 0; i < data.length - 4; i++) {
    const signature = new DataView(data.buffer, data.byteOffset + i, 4).getUint32(0, true);
    const isCentralDirectory = signature === 0x02014b50;
    if (isCentralDirectory) {
      foundCentralDir = true;
      break;
    }
  }
  expect(foundCentralDir).toBe(true);
}
function testIncludeEndOfCentralDirectory() {
  const zip = new MiniZip();
  zip.addFile("test.txt", "test");
  const data = zip.generate();
  const lastBytes = data.slice(-22);
  expect(lastBytes[0]).toBe(0x50);
  expect(lastBytes[1]).toBe(0x4b);
  expect(lastBytes[2]).toBe(0x05);
  expect(lastBytes[3]).toBe(0x06);
}
function testHandleLargeFiles() {
  const zip = new MiniZip();
  const largeContent = "x".repeat(100000);
  zip.addFile("large.txt", largeContent);
  const data = zip.generate();
  expect(data.length).toBeGreaterThan(100000);
}
function testGenerateEmptyZIPWhenNoFilesAdded() {
  const zip = new MiniZip();
  const data = zip.generate();
  expect(data.length).toBe(22);
}
function testMiniUnzip() {
  describe("getFile", testGetFile);
  describe("listFiles", testListFiles);
}
function testGetFile() {
  it("should retrieve added file content", testRetrieveAddedFileContent);
  it("should retrieve specific file from multiple", testRetrieveSpecificFileFromMultiple);
  it("should return null for non-existent file", testReturnNullForNonExistentFile);
  it("should handle nested paths", testHandleNestedPaths2);
  it("should handle empty content", testHandleEmptyContent2);
  it("should handle unicode content", testHandleUnicodeContent2);
}
function testRetrieveAddedFileContent() {
  const zip = new MiniZip();
  zip.addFile("test.txt", "Hello, World!");
  const data = zip.generate();
  const unzip = new MiniUnzip(data);
  const content = unzip.getFile("test.txt");
  expect(content).toBe("Hello, World!");
}
function testRetrieveSpecificFileFromMultiple() {
  const zip = new MiniZip();
  zip.addFile("file1.txt", "Content 1");
  zip.addFile("file2.txt", "Content 2");
  zip.addFile("file3.txt", "Content 3");
  const data = zip.generate();
  const unzip = new MiniUnzip(data);
  expect(unzip.getFile("file1.txt")).toBe("Content 1");
  expect(unzip.getFile("file2.txt")).toBe("Content 2");
  expect(unzip.getFile("file3.txt")).toBe("Content 3");
}
function testReturnNullForNonExistentFile() {
  const zip = new MiniZip();
  zip.addFile("exists.txt", "content");
  const data = zip.generate();
  const unzip = new MiniUnzip(data);
  const content = unzip.getFile("doesnotexist.txt");
  expect(content).toBeNull();
}
function testHandleNestedPaths2() {
  const zip = new MiniZip();
  zip.addFile("folder/subfolder/file.txt", "Nested!");
  const data = zip.generate();
  const unzip = new MiniUnzip(data);
  expect(unzip.getFile("folder/subfolder/file.txt")).toBe("Nested!");
}
function testHandleEmptyContent2() {
  const zip = new MiniZip();
  zip.addFile("empty.txt", "");
  const data = zip.generate();
  const unzip = new MiniUnzip(data);
  expect(unzip.getFile("empty.txt")).toBe("");
}
function testHandleUnicodeContent2() {
  const zip = new MiniZip();
  zip.addFile("unicode.txt", "日本語 한국어 中文");
  const data = zip.generate();
  const unzip = new MiniUnzip(data);
  expect(unzip.getFile("unicode.txt")).toBe("日本語 한국어 中文");
}
function testListFiles() {
  it("should list all files in ZIP", testListAllFilesInZIP);
  it("should list files with nested paths", testListFilesWithNestedPaths);
  it("should return empty array for empty ZIP", testReturnEmptyArrayForEmptyZIP);
}
function testListAllFilesInZIP() {
  const zip = new MiniZip();
  zip.addFile("a.txt", "A");
  zip.addFile("b.txt", "B");
  zip.addFile("c.txt", "C");
  const data = zip.generate();
  const unzip = new MiniUnzip(data);
  const files = unzip.listFiles();
  expect(files).toContain("a.txt");
  expect(files).toContain("b.txt");
  expect(files).toContain("c.txt");
  expect(files).toHaveLength(3);
}
function testListFilesWithNestedPaths() {
  const zip = new MiniZip();
  zip.addFile("root.txt", "root");
  zip.addFile("folder/nested.txt", "nested");
  zip.addFile("folder/deep/deeper.txt", "deep");
  const data = zip.generate();
  const unzip = new MiniUnzip(data);
  const files = unzip.listFiles();
  expect(files).toContain("root.txt");
  expect(files).toContain("folder/nested.txt");
  expect(files).toContain("folder/deep/deeper.txt");
}
function testReturnEmptyArrayForEmptyZIP() {
  const zip = new MiniZip();
  const data = zip.generate();
  const unzip = new MiniUnzip(data);
  const files = unzip.listFiles();
  expect(files).toEqual([]);
}
function testMiniZipMiniUnzipRoundtrip() {
  it("should preserve content through zip/unzip cycle", testPreserveContentThroughZipUnzipCycle);
  it("should handle XML content (XLSX use case)", testHandleXMLContentXLSXUseCase);
  it("should handle XLSX file structure", testHandleXLSXFileStructure);
}
function testPreserveContentThroughZipUnzipCycle() {
  const testFiles = createPreserveContentThroughZipUnzipCycleTestFiles();
  const zip = new MiniZip();
  testFiles.forEach((f) => {
    const result: void = zip.addFile(f.path, f.content);
    return result;
  });
  const data = zip.generate();
  const unzip = new MiniUnzip(data);
  testFiles.forEach((f) => {
    expect(unzip.getFile(f.path)).toBe(f.content);
  });
}
function testHandleXMLContentXLSXUseCase() {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="s"><v>0</v></c>
    </row>
  </sheetData>
</worksheet>`;
  const zip = new MiniZip();
  zip.addFile("xl/worksheets/sheet1.xml", xmlContent);
  const data = zip.generate();
  const unzip = new MiniUnzip(data);
  expect(unzip.getFile("xl/worksheets/sheet1.xml")).toBe(xmlContent);
}
function testHandleXLSXFileStructure() {
  const zip = new MiniZip();
  zip.addFile("[Content_Types].xml", '<?xml version="1.0"?><Types/>');
  zip.addFile("_rels/.rels", '<?xml version="1.0"?><Relationships/>');
  zip.addFile("xl/workbook.xml", '<?xml version="1.0"?><workbook/>');
  zip.addFile("xl/_rels/workbook.xml.rels", '<?xml version="1.0"?><Relationships/>');
  zip.addFile("xl/styles.xml", '<?xml version="1.0"?><styleSheet/>');
  zip.addFile("xl/sharedStrings.xml", '<?xml version="1.0"?><sst/>');
  zip.addFile("xl/worksheets/sheet1.xml", '<?xml version="1.0"?><worksheet/>');
  const data = zip.generate();
  const unzip = new MiniUnzip(data);
  const files = unzip.listFiles();
  expect(files).toContain("[Content_Types].xml");
  expect(files).toContain("xl/workbook.xml");
  expect(files).toContain("xl/worksheets/sheet1.xml");
}
function createPreserveContentThroughZipUnzipCycleTestFiles() {
  const fixture = [
    { path: "text.txt", content: "Simple text" },
    { path: "numbers.txt", content: "123456789" },
    { path: "special.txt", content: "!@#$%^&*()" },
    { path: "nested/path/file.xml", content: "<root><child/></root>" },
  ];
  return fixture;
}
