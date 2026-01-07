import { describe, it, expect } from "bun:test";
import { MiniZip, MiniUnzip } from "../src/zip";
import { supportsCompression, deflate, inflate } from "../src/zip/compress";
import {
  encodeString,
  decodeBytes,
  dosDateTime,
  createFileData,
  createFileDataCompressed,
  calculateZipSize,
  calculateZipSizeCompressed,
  sliceBytes,
  readUint16,
  readUint32,
  writeUint16,
  writeUint32,
} from "../src/zip/utils";

describe("MiniZip", () => {
  describe("addFile", () => {
    it("should add a string file", () => {
      const zip = new MiniZip();
      zip.addFile("test.txt", "Hello, World!");

      const data = zip.generate();
      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBeGreaterThan(0);
    });

    it("should add a Uint8Array file", () => {
      const zip = new MiniZip();
      const content = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      zip.addFile("binary.bin", content);

      const data = zip.generate();
      expect(data).toBeInstanceOf(Uint8Array);
    });

    it("should add multiple files", () => {
      const zip = new MiniZip();
      zip.addFile("file1.txt", "Content 1");
      zip.addFile("file2.txt", "Content 2");
      zip.addFile("file3.txt", "Content 3");

      const data = zip.generate();
      expect(data.length).toBeGreaterThan(0);
    });

    it("should handle nested paths", () => {
      const zip = new MiniZip();
      zip.addFile("folder/subfolder/file.txt", "Nested content");

      const data = zip.generate();
      expect(data.length).toBeGreaterThan(0);
    });

    it("should handle empty content", () => {
      const zip = new MiniZip();
      zip.addFile("empty.txt", "");

      const data = zip.generate();
      expect(data.length).toBeGreaterThan(0);
    });

    it("should handle unicode content", () => {
      const zip = new MiniZip();
      zip.addFile("unicode.txt", "Hello 世界 🌍");

      const data = zip.generate();
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe("generate", () => {
    it("should generate valid ZIP signature", () => {
      const zip = new MiniZip();
      zip.addFile("test.txt", "test");

      const data = zip.generate();

      // Local file header signature: PK\x03\x04
      expect(data[0]).toBe(0x50); // P
      expect(data[1]).toBe(0x4b); // K
      expect(data[2]).toBe(0x03);
      expect(data[3]).toBe(0x04);
    });

    it("should include central directory", () => {
      const zip = new MiniZip();
      zip.addFile("test.txt", "test content");

      const data = zip.generate();

      // Look for central directory signature: PK\x01\x02
      let foundCentralDir = false;
      for (let i = 0; i < data.length - 4; i++) {
        if (
          data[i] === 0x50 &&
          data[i + 1] === 0x4b &&
          data[i + 2] === 0x01 &&
          data[i + 3] === 0x02
        ) {
          foundCentralDir = true;
          break;
        }
      }
      expect(foundCentralDir).toBe(true);
    });

    it("should include end of central directory", () => {
      const zip = new MiniZip();
      zip.addFile("test.txt", "test");

      const data = zip.generate();

      // End of central directory signature: PK\x05\x06
      const lastBytes = data.slice(-22);
      expect(lastBytes[0]).toBe(0x50); // P
      expect(lastBytes[1]).toBe(0x4b); // K
      expect(lastBytes[2]).toBe(0x05);
      expect(lastBytes[3]).toBe(0x06);
    });

    it("should handle large files", () => {
      const zip = new MiniZip();
      const largeContent = "x".repeat(100000);
      zip.addFile("large.txt", largeContent);

      const data = zip.generate();
      expect(data.length).toBeGreaterThan(0);

      const unzip = new MiniUnzip(data);
      const content = unzip.getFile("large.txt");
      expect(content).toBe(largeContent);
    });

    it("should generate empty ZIP when no files added", () => {
      const zip = new MiniZip();
      const data = zip.generate();

      // Should still have valid ZIP structure with EOCD
      expect(data.length).toBe(22); // Just EOCD record
    });
  });
});

describe("MiniUnzip", () => {
  describe("getFile", () => {
    it("should retrieve added file content", () => {
      const zip = new MiniZip();
      zip.addFile("test.txt", "Hello, World!");

      const data = zip.generate();
      const unzip = new MiniUnzip(data);

      const content = unzip.getFile("test.txt");
      expect(content).toBe("Hello, World!");
    });

    it("should retrieve specific file from multiple", () => {
      const zip = new MiniZip();
      zip.addFile("file1.txt", "Content 1");
      zip.addFile("file2.txt", "Content 2");
      zip.addFile("file3.txt", "Content 3");

      const data = zip.generate();
      const unzip = new MiniUnzip(data);

      expect(unzip.getFile("file1.txt")).toBe("Content 1");
      expect(unzip.getFile("file2.txt")).toBe("Content 2");
      expect(unzip.getFile("file3.txt")).toBe("Content 3");
    });

    it("should return null for non-existent file", () => {
      const zip = new MiniZip();
      zip.addFile("exists.txt", "content");

      const data = zip.generate();
      const unzip = new MiniUnzip(data);

      const content = unzip.getFile("doesnotexist.txt");
      expect(content).toBeNull();
    });

    it("should handle nested paths", () => {
      const zip = new MiniZip();
      zip.addFile("folder/subfolder/file.txt", "Nested!");

      const data = zip.generate();
      const unzip = new MiniUnzip(data);

      expect(unzip.getFile("folder/subfolder/file.txt")).toBe("Nested!");
    });

    it("should handle empty content", () => {
      const zip = new MiniZip();
      zip.addFile("empty.txt", "");

      const data = zip.generate();
      const unzip = new MiniUnzip(data);

      expect(unzip.getFile("empty.txt")).toBe("");
    });

    it("should handle unicode content", () => {
      const zip = new MiniZip();
      zip.addFile("unicode.txt", "日本語 한국어 中文");

      const data = zip.generate();
      const unzip = new MiniUnzip(data);

      expect(unzip.getFile("unicode.txt")).toBe("日本語 한국어 中文");
    });
  });

  describe("listFiles", () => {
    it("should list all files in ZIP", () => {
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
    });

    it("should list files with nested paths", () => {
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
    });

    it("should return empty array for empty ZIP", () => {
      const zip = new MiniZip();
      const data = zip.generate();
      const unzip = new MiniUnzip(data);

      const files = unzip.listFiles();
      expect(files).toEqual([]);
    });
  });
});

describe("MiniZip/MiniUnzip roundtrip", () => {
  it("should preserve content through zip/unzip cycle", () => {
    const testFiles = [
      { path: "text.txt", content: "Simple text" },
      { path: "numbers.txt", content: "123456789" },
      { path: "special.txt", content: "!@#$%^&*()" },
      { path: "nested/path/file.xml", content: "<root><child/></root>" },
    ];

    const zip = new MiniZip();
    testFiles.forEach((f) => zip.addFile(f.path, f.content));

    const data = zip.generate();
    const unzip = new MiniUnzip(data);

    testFiles.forEach((f) => {
      expect(unzip.getFile(f.path)).toBe(f.content);
    });
  });

  it("should handle XML content (XLSX use case)", () => {
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
  });

  it("should handle XLSX file structure", () => {
    const zip = new MiniZip();
    zip.addFile("[Content_Types].xml", '<?xml version="1.0"?><Types/>');
    zip.addFile("_rels/.rels", '<?xml version="1.0"?><Relationships/>');
    zip.addFile("xl/workbook.xml", '<?xml version="1.0"?><workbook/>');
    zip.addFile(
      "xl/_rels/workbook.xml.rels",
      '<?xml version="1.0"?><Relationships/>',
    );
    zip.addFile("xl/styles.xml", '<?xml version="1.0"?><styleSheet/>');
    zip.addFile("xl/sharedStrings.xml", '<?xml version="1.0"?><sst/>');
    zip.addFile(
      "xl/worksheets/sheet1.xml",
      '<?xml version="1.0"?><worksheet/>',
    );

    const data = zip.generate();
    const unzip = new MiniUnzip(data);

    const files = unzip.listFiles();
    expect(files).toContain("[Content_Types].xml");
    expect(files).toContain("xl/workbook.xml");
    expect(files).toContain("xl/worksheets/sheet1.xml");
  });
});

describe("Compression utilities", () => {
  describe("supportsCompression", () => {
    it("should return boolean indicating compression support", () => {
      const result = supportsCompression();
      expect(typeof result).toBe("boolean");
    });

    it("should return true in Bun environment", () => {
      expect(supportsCompression()).toBe(true);
    });
  });

  describe("deflate", () => {
    it("should compress data", async () => {
      const data = new TextEncoder().encode("Hello, World!");
      const compressed = await deflate(data);

      expect(compressed).toBeInstanceOf(Uint8Array);
      expect(compressed.length).toBeGreaterThan(0);
    });

    it("should compress repetitive data efficiently", async () => {
      const repetitiveData = new TextEncoder().encode(
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      );
      const compressed = await deflate(repetitiveData);

      expect(compressed.length).toBeLessThan(repetitiveData.length);
    });
  });

  describe("inflate", () => {
    it("should decompress deflated data", async () => {
      const original = new TextEncoder().encode("Hello, World!");
      const compressed = await deflate(original);
      const decompressed = await inflate(compressed);

      expect(new TextDecoder().decode(decompressed)).toBe("Hello, World!");
    });

    it("should handle roundtrip compression", async () => {
      const testData = new TextEncoder().encode(
        "Test data for roundtrip compression verification!",
      );
      const compressed = await deflate(testData);
      const decompressed = await inflate(compressed);

      expect(decompressed).toEqual(testData);
    });
  });
});

describe("Zip utility functions", () => {
  describe("encodeString/decodeBytes", () => {
    it("should encode string to Uint8Array", () => {
      const result = encodeString("Hello");
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
    });

    it("should decode Uint8Array to string", () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]);
      expect(decodeBytes(bytes)).toBe("Hello");
    });

    it("should handle unicode roundtrip", () => {
      const original = "日本語 한국어 中文";
      const encoded = encodeString(original);
      const decoded = decodeBytes(encoded);
      expect(decoded).toBe(original);
    });
  });

  describe("dosDateTime", () => {
    it("should convert date to DOS format", () => {
      const date = new Date("2024-06-15T14:30:45");
      const result = dosDateTime(date);

      expect(result.date).toBeGreaterThan(0);
      expect(result.time).toBeGreaterThan(0);
    });

    it("should handle epoch edge case", () => {
      const date = new Date("1980-01-01T00:00:00");
      const result = dosDateTime(date);

      expect(result.date).toBe((0 << 9) | (1 << 5) | 1);
      expect(result.time).toBe(0);
    });
  });

  describe("createFileData", () => {
    it("should create file data without compression", () => {
      const file = {
        path: "test.txt",
        data: new TextEncoder().encode("Hello"),
      };
      const result = createFileData(file, 0, false);

      expect(result.fileName).toBeInstanceOf(Uint8Array);
      expect(result.crc).toBeGreaterThan(0);
      expect(result.data).toEqual(file.data);
      expect(result.offset).toBe(0);
      expect(result.compressionMethod).toBe(0);
    });

    it("should set compression method when compress is true", () => {
      const file = {
        path: "test.txt",
        data: new TextEncoder().encode("Hello"),
      };
      const result = createFileData(file, 100, true);

      expect(result.offset).toBe(100);
      expect(result.compressionMethod).toBe(8);
    });
  });

  describe("createFileDataCompressed", () => {
    it("should create compressed file data", async () => {
      const file = {
        path: "test.txt",
        data: new TextEncoder().encode("Hello, World!"),
      };
      const result = await createFileDataCompressed(file, 0);

      expect(result.compressedData).toBeDefined();
      expect(result.compressedData).toBeInstanceOf(Uint8Array);
      expect(result.compressionMethod).toBe(8);
    });

    it("should include original data for CRC calculation", async () => {
      const file = {
        path: "test.txt",
        data: new TextEncoder().encode("Test data"),
      };
      const result = await createFileDataCompressed(file, 50);

      expect(result.data).toEqual(file.data);
      expect(result.offset).toBe(50);
    });
  });

  describe("calculateZipSize", () => {
    it("should calculate size for single file", () => {
      const files = [
        { path: "test.txt", data: new TextEncoder().encode("Hello") },
      ];
      const result = calculateZipSize(files);

      expect(result.totalSize).toBeGreaterThan(0);
      expect(result.fileData).toHaveLength(1);
    });

    it("should calculate size for multiple files", () => {
      const files = [
        { path: "a.txt", data: new TextEncoder().encode("A") },
        { path: "b.txt", data: new TextEncoder().encode("BB") },
        { path: "c.txt", data: new TextEncoder().encode("CCC") },
      ];
      const result = calculateZipSize(files);

      expect(result.fileData).toHaveLength(3);
      expect(result.fileData[0].offset).toBe(0);
      expect(result.fileData[1].offset).toBeGreaterThan(0);
      expect(result.fileData[2].offset).toBeGreaterThan(
        result.fileData[1].offset,
      );
    });
  });

  describe("calculateZipSizeCompressed", () => {
    it("should calculate size with compression", async () => {
      const files = [
        { path: "test.txt", data: new TextEncoder().encode("Hello World") },
      ];
      const result = await calculateZipSizeCompressed(files);

      expect(result.totalSize).toBeGreaterThan(0);
      expect(result.fileData).toHaveLength(1);
      expect(result.fileData[0].compressedData).toBeDefined();
    });

    it("should handle multiple files", async () => {
      const files = [
        { path: "a.txt", data: new TextEncoder().encode("AAAAAAAAAA") },
        { path: "b.txt", data: new TextEncoder().encode("BBBBBBBBBB") },
      ];
      const result = await calculateZipSizeCompressed(files);

      expect(result.fileData).toHaveLength(2);
      expect(result.fileData[0].offset).toBe(0);
      expect(result.fileData[1].offset).toBeGreaterThan(0);
    });
  });

  describe("sliceBytes", () => {
    it("should slice Uint8Array", () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const result = sliceBytes(data, 1, 4);

      expect(result).toEqual(new Uint8Array([2, 3, 4]));
    });
  });

  describe("DataView helpers", () => {
    it("should read/write Uint16 in little endian", () => {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);

      writeUint16(view, 0, 0x1234);
      expect(readUint16(view, 0)).toBe(0x1234);
    });

    it("should read/write Uint32 in little endian", () => {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);

      writeUint32(view, 0, 0x12345678);
      expect(readUint32(view, 0)).toBe(0x12345678);
    });
  });
});

describe("MiniZip compressed", () => {
  describe("generateCompressed", () => {
    it("should generate compressed ZIP", async () => {
      const zip = new MiniZip();
      zip.addFile("test.txt", "Hello, World!");

      const data = await zip.generateCompressed();
      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBeGreaterThan(0);
    });

    it("should produce smaller output for repetitive content", async () => {
      const zip = new MiniZip();
      const repetitive = "abcdefgh".repeat(1000);
      zip.addFile("large.txt", repetitive);

      const uncompressed = zip.generate();
      const compressed = await zip.generateCompressed();

      expect(compressed.length).toBeLessThan(uncompressed.length);
    });

    it("should be readable after compression with async method", async () => {
      const zip = new MiniZip();
      const content = "Test content for compression";
      zip.addFile("test.txt", content);

      const data = await zip.generateCompressed();
      const unzip = new MiniUnzip(data);

      const result = await unzip.getFileAsync("test.txt");
      expect(result).toBe(content);
    });
  });
});
