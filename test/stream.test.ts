import { describe, it, expect } from "bun:test";
import {
  encodeChunk,
  streamWorksheetStart,
  streamWorksheetEnd,
  streamRow,
  streamWorksheet,
  generateSharedStringsChunk,
  StreamingXlsxWriter,
} from "../src/xlsx/stream";

describe("Streaming XLSX", () => {
  describe("encodeChunk", () => {
    it("should encode string to Uint8Array", () => {
      const result = encodeChunk("test");
      expect(result).toBeInstanceOf(Uint8Array);
      expect(new TextDecoder().decode(result)).toBe("test");
    });
  });

  describe("streamWorksheetStart", () => {
    it("should yield worksheet opening tags", () => {
      const generator = streamWorksheetStart();
      const result = generator.next();

      expect(result.done).toBe(false);
      const decoded = new TextDecoder().decode(result.value);
      expect(decoded).toContain('<?xml version="1.0"');
      expect(decoded).toContain("<worksheet");
      expect(decoded).toContain("<sheetData>");
    });
  });

  describe("streamWorksheetEnd", () => {
    it("should yield worksheet closing tags", () => {
      const generator = streamWorksheetEnd();
      const result = generator.next();

      expect(result.done).toBe(false);
      const decoded = new TextDecoder().decode(result.value);
      expect(decoded).toBe("</sheetData></worksheet>");
    });
  });

  describe("streamRow", () => {
    const mockAddSharedString = (str: string) => {
      const map = new Map<string, number>();
      if (!map.has(str)) {
        map.set(str, map.size);
      }
      return map.get(str)!;
    };

    it("should generate row XML for string values", () => {
      const result = streamRow(["Hello", "World"], 0, mockAddSharedString);

      expect(result).not.toBeNull();
      const decoded = new TextDecoder().decode(result!);
      expect(decoded).toContain('<row r="1">');
      expect(decoded).toContain('t="s"');
    });

    it("should generate row XML for number values", () => {
      const result = streamRow([42, 3.14], 0, mockAddSharedString);

      expect(result).not.toBeNull();
      const decoded = new TextDecoder().decode(result!);
      expect(decoded).toContain('<row r="1">');
      expect(decoded).toContain("<v>42</v>");
      expect(decoded).toContain("<v>3.14</v>");
    });

    it("should generate row XML for boolean values", () => {
      const result = streamRow([true, false], 0, mockAddSharedString);

      expect(result).not.toBeNull();
      const decoded = new TextDecoder().decode(result!);
      expect(decoded).toContain('t="b"');
      expect(decoded).toContain("<v>1</v>");
      expect(decoded).toContain("<v>0</v>");
    });

    it("should return null for empty row", () => {
      const result = streamRow([null, null], 0, mockAddSharedString);
      expect(result).toBeNull();
    });

    it("should skip empty cells", () => {
      const result = streamRow(["A", null, "C"], 0, mockAddSharedString);

      expect(result).not.toBeNull();
      const decoded = new TextDecoder().decode(result!);
      expect(decoded).toContain('r="A1"');
      expect(decoded).toContain('r="C1"');
      expect(decoded).not.toContain('r="B1"');
    });

    it("should use correct row number", () => {
      const result = streamRow(["test"], 4, mockAddSharedString);

      expect(result).not.toBeNull();
      const decoded = new TextDecoder().decode(result!);
      expect(decoded).toContain('<row r="5">');
    });
  });

  describe("streamWorksheet", () => {
    it("should stream complete worksheet", async () => {
      const rows = [
        ["Header1", "Header2"],
        ["Value1", "Value2"],
      ];
      const sharedStrings: string[] = [];
      const addSharedString = (str: string) => {
        const idx = sharedStrings.indexOf(str);
        if (idx >= 0) return idx;
        sharedStrings.push(str);
        return sharedStrings.length - 1;
      };

      const chunks: Uint8Array[] = [];
      for await (const chunk of streamWorksheet(rows, addSharedString)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);

      const fullContent = new TextDecoder().decode(
        new Uint8Array(
          chunks.reduce((acc, c) => [...acc, ...c], [] as number[]),
        ),
      );
      expect(fullContent).toContain('<?xml version="1.0"');
      expect(fullContent).toContain("<worksheet");
      expect(fullContent).toContain("<sheetData>");
      expect(fullContent).toContain("</sheetData></worksheet>");
      expect(fullContent).toContain('<row r="1">');
      expect(fullContent).toContain('<row r="2">');
    });

    it("should handle async iterables", async () => {
      async function* asyncRows() {
        yield ["Row1"];
        yield ["Row2"];
      }

      const addSharedString = () => 0;
      const chunks: Uint8Array[] = [];

      for await (const chunk of streamWorksheet(asyncRows(), addSharedString)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe("generateSharedStringsChunk", () => {
    it("should generate shared strings XML", () => {
      const result = generateSharedStringsChunk(["Hello", "World"]);
      const decoded = new TextDecoder().decode(result);

      expect(decoded).toContain('<?xml version="1.0"');
      expect(decoded).toContain("<sst");
      expect(decoded).toContain('count="2"');
      expect(decoded).toContain('uniqueCount="2"');
      expect(decoded).toContain("<si><t>Hello</t></si>");
      expect(decoded).toContain("<si><t>World</t></si>");
      expect(decoded).toContain("</sst>");
    });

    it("should escape special characters", () => {
      const result = generateSharedStringsChunk(["<test>", "&value"]);
      const decoded = new TextDecoder().decode(result);

      expect(decoded).toContain("&lt;test&gt;");
      expect(decoded).toContain("&amp;value");
    });
  });

  describe("StreamingXlsxWriter", () => {
    it("should create instance", () => {
      const writer = new StreamingXlsxWriter();
      expect(writer).toBeInstanceOf(StreamingXlsxWriter);
    });

    it("should add and retrieve shared strings", () => {
      const writer = new StreamingXlsxWriter();

      const idx1 = writer.addSharedString("Hello");
      const idx2 = writer.addSharedString("World");
      const idx3 = writer.addSharedString("Hello"); // duplicate

      expect(idx1).toBe(0);
      expect(idx2).toBe(1);
      expect(idx3).toBe(0); // should return existing index

      expect(writer.getSharedStrings()).toEqual(["Hello", "World"]);
    });

    it("should stream worksheet", async () => {
      const writer = new StreamingXlsxWriter();
      const rows = [["Test"]];

      const chunks: Uint8Array[] = [];
      for await (const chunk of writer.streamWorksheet(rows)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it("should generate shared strings XML", () => {
      const writer = new StreamingXlsxWriter();
      writer.addSharedString("Test1");
      writer.addSharedString("Test2");

      const result = writer.generateSharedStringsXml();
      const decoded = new TextDecoder().decode(result);

      expect(decoded).toContain("<si><t>Test1</t></si>");
      expect(decoded).toContain("<si><t>Test2</t></si>");
    });
  });
});
