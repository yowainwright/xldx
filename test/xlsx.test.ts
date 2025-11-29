import { describe, it, expect } from "bun:test";
import { XlsxWriter, XlsxReader } from "../src/xlsx";

describe("XlsxWriter", () => {
  describe("addWorksheet", () => {
    it("should add a worksheet with data", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Sheet1", [
        ["Name", "Age"],
        ["Alice", 30],
        ["Bob", 25]
      ]);

      const xlsx = writer.generate();
      expect(xlsx).toBeInstanceOf(Uint8Array);
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should add multiple worksheets", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Sheet1", [["A", "B"], [1, 2]]);
      writer.addWorksheet("Sheet2", [["C", "D"], [3, 4]]);

      const xlsx = writer.generate();
      expect(xlsx).toBeInstanceOf(Uint8Array);
    });

    it("should handle column widths", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Sheet1", [["Name", "Age"]], [20, 10]);

      const xlsx = writer.generate();
      expect(xlsx).toBeInstanceOf(Uint8Array);
    });
  });

  describe("generate", () => {
    it("should generate valid ZIP structure", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Test", [["Hello"]]);

      const xlsx = writer.generate();

      // ZIP files start with PK signature (0x04034b50)
      expect(xlsx[0]).toBe(0x50); // P
      expect(xlsx[1]).toBe(0x4b); // K
    });

    it("should handle string values", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Test", [
        ["String1", "String2"],
        ["Hello", "World"]
      ]);

      const xlsx = writer.generate();
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should handle number values", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Test", [
        [1, 2, 3],
        [4.5, 6.7, 8.9]
      ]);

      const xlsx = writer.generate();
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should handle boolean values", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Test", [
        [true, false],
        [false, true]
      ]);

      const xlsx = writer.generate();
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should handle null and undefined values", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Test", [
        [null, undefined, ""],
        ["value", null, undefined]
      ]);

      const xlsx = writer.generate();
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should handle Date values", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Test", [
        ["Date"],
        [new Date("2024-01-15")]
      ]);

      const xlsx = writer.generate();
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should handle Cell objects with value property", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Test", [
        [{ value: "Test", style: { font: { bold: true } } }],
        [{ value: 123, style: {} }]
      ]);

      const xlsx = writer.generate();
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should escape XML special characters", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Test", [
        ["<test>", "&value", '"quoted"', "'apostrophe'"]
      ]);

      const xlsx = writer.generate();
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should handle sheet names with special characters", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Sheet <1>", [["test"]]);

      const xlsx = writer.generate();
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should handle empty worksheet", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Empty", []);

      const xlsx = writer.generate();
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should handle large column indices", () => {
      const writer = new XlsxWriter();
      const row = Array(30).fill("test");
      writer.addWorksheet("Wide", [row]);

      const xlsx = writer.generate();
      expect(xlsx.length).toBeGreaterThan(0);
    });
  });
});

describe("XlsxReader", () => {
  describe("read", () => {
    it("should read back written data", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("TestSheet", [
        ["Name", "Age"],
        ["Alice", 30],
        ["Bob", 25]
      ]);

      const xlsx = writer.generate();
      const reader = new XlsxReader(xlsx);
      const result = reader.read();

      expect(result.sheets).toHaveLength(1);
      expect(result.sheets[0].name).toBe("TestSheet");
      expect(result.sheets[0].data[0]).toEqual(["Name", "Age"]);
      expect(result.sheets[0].data[1]).toEqual(["Alice", 30]);
      expect(result.sheets[0].data[2]).toEqual(["Bob", 25]);
    });

    it("should read multiple sheets", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Sheet1", [["A"], ["B"]]);
      writer.addWorksheet("Sheet2", [["C"], ["D"]]);

      const xlsx = writer.generate();
      const reader = new XlsxReader(xlsx);
      const result = reader.read();

      expect(result.sheets).toHaveLength(2);
      expect(result.sheets[0].name).toBe("Sheet1");
      expect(result.sheets[1].name).toBe("Sheet2");
    });

    it("should handle numbers correctly", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Numbers", [
        [1, 2.5, -3, 0]
      ]);

      const xlsx = writer.generate();
      const reader = new XlsxReader(xlsx);
      const result = reader.read();

      expect(result.sheets[0].data[0]).toEqual([1, 2.5, -3, 0]);
    });

    it("should handle booleans correctly", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Bools", [
        [true, false]
      ]);

      const xlsx = writer.generate();
      const reader = new XlsxReader(xlsx);
      const result = reader.read();

      expect(result.sheets[0].data[0]).toEqual([true, false]);
    });

    it("should handle empty cells", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Sparse", [
        ["A", null, "C"],
        [null, "B", null]
      ]);

      const xlsx = writer.generate();
      const reader = new XlsxReader(xlsx);
      const result = reader.read();

      expect(result.sheets[0].data[0][0]).toBe("A");
      expect(result.sheets[0].data[0][2]).toBe("C");
    });

    it("should handle XML-escaped content", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Escaped", [
        ["<tag>", "&amp;", '"quote"']
      ]);

      const xlsx = writer.generate();
      const reader = new XlsxReader(xlsx);
      const result = reader.read();

      expect(result.sheets[0].data[0][0]).toBe("<tag>");
      expect(result.sheets[0].data[0][1]).toBe("&amp;");
    });
  });
});

describe("XlsxWriter/XlsxReader roundtrip", () => {
  it("should preserve data through write/read cycle", () => {
    const originalData = [
      ["Header1", "Header2", "Header3"],
      ["String", 123, true],
      ["Another", 456.78, false],
      ["", null, 0]
    ];

    const writer = new XlsxWriter();
    writer.addWorksheet("RoundTrip", originalData);

    const xlsx = writer.generate();
    const reader = new XlsxReader(xlsx);
    const result = reader.read();

    expect(result.sheets[0].data[0]).toEqual(["Header1", "Header2", "Header3"]);
    expect(result.sheets[0].data[1]).toEqual(["String", 123, true]);
    expect(result.sheets[0].data[2]).toEqual(["Another", 456.78, false]);
  });

  it("should handle shared strings efficiently", () => {
    const writer = new XlsxWriter();
    writer.addWorksheet("SharedStrings", [
      ["Repeated", "Repeated", "Repeated"],
      ["Repeated", "Unique", "Repeated"]
    ]);

    const xlsx = writer.generate();
    const reader = new XlsxReader(xlsx);
    const result = reader.read();

    expect(result.sheets[0].data[0]).toEqual(["Repeated", "Repeated", "Repeated"]);
    expect(result.sheets[0].data[1][1]).toBe("Unique");
  });
});
