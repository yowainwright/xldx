import { describe, it, expect } from "bun:test";
import { MiniZip, MiniUnzip } from "../src/zip";

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
        if (data[i] === 0x50 && data[i + 1] === 0x4b &&
            data[i + 2] === 0x01 && data[i + 3] === 0x02) {
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
      expect(data.length).toBeGreaterThan(100000);
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
      { path: "nested/path/file.xml", content: "<root><child/></root>" }
    ];

    const zip = new MiniZip();
    testFiles.forEach(f => zip.addFile(f.path, f.content));

    const data = zip.generate();
    const unzip = new MiniUnzip(data);

    testFiles.forEach(f => {
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
  });
});
