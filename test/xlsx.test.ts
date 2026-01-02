import { describe, it, expect } from "bun:test";
import { XlsxWriter, XlsxReader } from "../src/xlsx";

describe("XlsxWriter", () => {
  describe("addWorksheet", () => {
    it("should add a worksheet with data", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Sheet1", [
        ["Name", "Age"],
        ["Alice", 30],
        ["Bob", 25],
      ]);

      const xlsx = writer.generate();
      expect(xlsx).toBeInstanceOf(Uint8Array);
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should add multiple worksheets", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Sheet1", [
        ["A", "B"],
        [1, 2],
      ]);
      writer.addWorksheet("Sheet2", [
        ["C", "D"],
        [3, 4],
      ]);

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
        ["Hello", "World"],
      ]);

      const xlsx = writer.generate();
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should handle number values", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Test", [
        [1, 2, 3],
        [4.5, 6.7, 8.9],
      ]);

      const xlsx = writer.generate();
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should handle boolean values", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Test", [
        [true, false],
        [false, true],
      ]);

      const xlsx = writer.generate();
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should handle null and undefined values", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Test", [
        [null, undefined, ""],
        ["value", null, undefined],
      ]);

      const xlsx = writer.generate();
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should handle Date values", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Test", [["Date"], [new Date("2024-01-15")]]);

      const xlsx = writer.generate();
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should handle Cell objects with value property", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Test", [
        [{ value: "Test", style: { font: { bold: true } } }],
        [{ value: 123, style: {} }],
      ]);

      const xlsx = writer.generate();
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it("should escape XML special characters", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Test", [
        ["<test>", "&value", '"quoted"', "'apostrophe'"],
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
        ["Bob", 25],
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
      writer.addWorksheet("Numbers", [[1, 2.5, -3, 0]]);

      const xlsx = writer.generate();
      const reader = new XlsxReader(xlsx);
      const result = reader.read();

      expect(result.sheets[0].data[0]).toEqual([1, 2.5, -3, 0]);
    });

    it("should handle booleans correctly", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Bools", [[true, false]]);

      const xlsx = writer.generate();
      const reader = new XlsxReader(xlsx);
      const result = reader.read();

      expect(result.sheets[0].data[0]).toEqual([true, false]);
    });

    it("should handle empty cells", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Sparse", [
        ["A", null, "C"],
        [null, "B", null],
      ]);

      const xlsx = writer.generate();
      const reader = new XlsxReader(xlsx);
      const result = reader.read();

      expect(result.sheets[0].data[0][0]).toBe("A");
      expect(result.sheets[0].data[0][2]).toBe("C");
    });

    it("should handle XML-escaped content", () => {
      const writer = new XlsxWriter();
      writer.addWorksheet("Escaped", [["<tag>", "&amp;", '"quote"']]);

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
      ["", null, 0],
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
      ["Repeated", "Unique", "Repeated"],
    ]);

    const xlsx = writer.generate();
    const reader = new XlsxReader(xlsx);
    const result = reader.read();

    expect(result.sheets[0].data[0]).toEqual([
      "Repeated",
      "Repeated",
      "Repeated",
    ]);
    expect(result.sheets[0].data[1][1]).toBe("Unique");
  });
});

describe("Formula support", () => {
  it("should generate cells with formulas", () => {
    const writer = new XlsxWriter();
    writer.addWorksheet("Formulas", [
      [1, 2, { value: null, formula: "SUM(A1:B1)" }],
      [{ value: 10, formula: "A1*10" }],
    ]);

    const xlsx = writer.generate();
    expect(xlsx.length).toBeGreaterThan(0);
  });

  it("should handle formula-only cells", () => {
    const writer = new XlsxWriter();
    writer.addWorksheet("FormulaOnly", [[{ formula: "TODAY()" }]]);

    const xlsx = writer.generate();
    expect(xlsx.length).toBeGreaterThan(0);
  });
});

describe("Merged cells support", () => {
  it("should handle merged cells in worksheet", async () => {
    const { generateMergedCells } = await import("../src/xlsx");

    const xml = generateMergedCells([
      { start: { row: 0, col: 0 }, end: { row: 0, col: 2 } },
      { start: { row: 1, col: 0 }, end: { row: 3, col: 0 } },
    ]);

    expect(xml).toContain('<mergeCells count="2">');
    expect(xml).toContain('<mergeCell ref="A1:C1"/>');
    expect(xml).toContain('<mergeCell ref="A2:A4"/>');
  });
});

describe("Frozen panes support", () => {
  it("should generate frozen row pane", async () => {
    const { generateFrozenPane } = await import("../src/xlsx");

    const xml = generateFrozenPane({ rows: 1 });

    expect(xml).toContain('ySplit="1"');
    expect(xml).toContain('xSplit="0"');
    expect(xml).toContain('state="frozen"');
    expect(xml).toContain('activePane="bottomLeft"');
  });

  it("should generate frozen column pane", async () => {
    const { generateFrozenPane } = await import("../src/xlsx");

    const xml = generateFrozenPane({ cols: 2 });

    expect(xml).toContain('xSplit="2"');
    expect(xml).toContain('ySplit="0"');
    expect(xml).toContain('activePane="topRight"');
  });

  it("should generate frozen row and column pane", async () => {
    const { generateFrozenPane } = await import("../src/xlsx");

    const xml = generateFrozenPane({ rows: 1, cols: 1 });

    expect(xml).toContain('xSplit="1"');
    expect(xml).toContain('ySplit="1"');
    expect(xml).toContain('activePane="bottomRight"');
  });
});

describe("Row heights support", () => {
  it("should generate rows with custom heights", async () => {
    const { generateRow } = await import("../src/xlsx");

    const xml = generateRow(["test"], 0, () => 0, 30);

    expect(xml).toContain('ht="30"');
    expect(xml).toContain('customHeight="1"');
  });
});

describe("Style resolution", () => {
  it("should resolve cell styles when reading with styles", async () => {
    const { parseStyles, parseWorksheetContentWithStyles } = await import(
      "../src/xlsx"
    );

    const stylesXml = `<?xml version="1.0" encoding="UTF-8"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><i/><sz val="14"/><color rgb="FF0000FF"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/></patternFill></fill>
</fills>
<borders count="1">
<border><left/><right/><top/><bottom/></border>
</borders>
<cellXfs count="2">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"/>
</cellXfs>
</styleSheet>`;

    const worksheetXml = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>
<row r="1"><c r="A1" s="1"><v>123</v></c></row>
</sheetData>
</worksheet>`;

    const styles = parseStyles(stylesXml);
    const result = parseWorksheetContentWithStyles(worksheetXml, [], styles);

    expect(result.data[0]).toBeDefined();
    expect(result.data[0][0]).toBeDefined();
    expect(result.data[0][0].value).toBe(123);
    expect(result.data[0][0].style).toBeDefined();
    expect(result.data[0][0].style?.font?.bold).toBe(true);
    expect(result.data[0][0].style?.font?.italic).toBe(true);
    expect(result.data[0][0].style?.fill?.color).toBe("#FFFF00");
  });

  it("should handle cells without styles", async () => {
    const { parseStyles, parseWorksheetContentWithStyles } = await import(
      "../src/xlsx"
    );

    const stylesXml = `<?xml version="1.0"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="1"><font/></fonts>
<fills count="1"><fill><patternFill patternType="none"/></fill></fills>
<borders count="1"><border/></borders>
<cellXfs count="1"><xf/></cellXfs>
</styleSheet>`;

    const worksheetXml = `<?xml version="1.0"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>
<row r="1"><c r="A1"><v>42</v></c></row>
</sheetData>
</worksheet>`;

    const styles = parseStyles(stylesXml);
    const result = parseWorksheetContentWithStyles(worksheetXml, [], styles);

    expect(result.data[0][0].value).toBe(42);
  });
});

describe("Style parsing", () => {
  it("should parse styles from content", async () => {
    const { parseStyles } = await import("../src/xlsx");

    const stylesXml = `<?xml version="1.0" encoding="UTF-8"?>
      <styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <fonts count="2">
          <font><sz val="11"/><name val="Calibri"/></font>
          <font><b/><sz val="14"/><color rgb="FF0000FF"/></font>
        </fonts>
        <fills count="2">
          <fill><patternFill patternType="none"/></fill>
          <fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/></patternFill></fill>
        </fills>
        <borders count="1">
          <border><left/><right/><top/><bottom/></border>
        </borders>
        <cellXfs count="2">
          <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
          <xf numFmtId="0" fontId="1" fillId="1" borderId="0" applyFont="1" applyFill="1"/>
        </cellXfs>
      </styleSheet>`;

    const styles = parseStyles(stylesXml);

    expect(styles.fonts).toHaveLength(2);
    expect(styles.fonts[1].bold).toBe(true);
    expect(styles.fonts[1].size).toBe(14);
    expect(styles.fonts[1].color).toBe("#0000FF");

    expect(styles.fills).toHaveLength(2);
    expect(styles.fills[1].color).toBe("#FFFF00");

    expect(styles.cellXfs).toHaveLength(2);
    expect(styles.cellXfs[1].fontId).toBe(1);
    expect(styles.cellXfs[1].fillId).toBe(1);
  });

  it("should parse column widths", async () => {
    const { parseColumnWidths } = await import("../src/xlsx");

    const worksheetXml = `<worksheet>
      <cols>
        <col min="1" max="1" width="15.5"/>
        <col min="2" max="3" width="20"/>
      </cols>
      <sheetData></sheetData>
    </worksheet>`;

    const widths = parseColumnWidths(worksheetXml);

    expect(widths[0]).toBe(15.5);
    expect(widths[1]).toBe(20);
    expect(widths[2]).toBe(20);
  });

  it("should parse row heights", async () => {
    const { parseRowHeights } = await import("../src/xlsx");

    const worksheetXml = `<worksheet>
      <sheetData>
        <row r="1" ht="25"><c r="A1"><v>test</v></c></row>
        <row r="3" ht="30"><c r="A3"><v>test</v></c></row>
      </sheetData>
    </worksheet>`;

    const heights = parseRowHeights(worksheetXml);

    expect(heights[0]).toBe(25);
    expect(heights[1]).toBeUndefined();
    expect(heights[2]).toBe(30);
  });
});

describe("XlsxReader with styles", () => {
  it("should read workbook with styles", () => {
    const writer = new XlsxWriter();
    writer.addWorksheet(
      "Test",
      [
        ["Header", "Value"],
        ["Data", 123],
      ],
      [15, 10],
    );

    const xlsx = writer.generate();
    const reader = new XlsxReader(xlsx);
    const result = reader.readWithStyles();

    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].name).toBe("Test");
    expect(result.sheets[0].columnWidths).toHaveLength(2);
    expect(result.sheets[0].columnWidths![0]).toBe(15);
    expect(result.sheets[0].columnWidths![1]).toBe(10);
  });

  it("should return cell objects with value property", () => {
    const writer = new XlsxWriter();
    writer.addWorksheet("Test", [["Hello", 42, true]]);

    const xlsx = writer.generate();
    const reader = new XlsxReader(xlsx);
    const result = reader.readWithStyles();

    const firstRow = result.sheets[0].data[0];
    expect(firstRow[0].value).toBe("Hello");
    expect(firstRow[1].value).toBe(42);
    expect(firstRow[2].value).toBe(true);
  });

  it("should read workbook with styles async", async () => {
    const writer = new XlsxWriter();
    writer.addWorksheet(
      "TestAsync",
      [
        ["Header", "Value"],
        ["Data", 123],
      ],
      [20, 15],
    );

    const xlsx = writer.generate();
    const reader = new XlsxReader(xlsx);
    const result = await reader.readWithStylesAsync();

    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].name).toBe("TestAsync");
    expect(result.sheets[0].columnWidths).toHaveLength(2);
  });

  it("should handle empty sheet in readWithStylesAsync", async () => {
    const writer = new XlsxWriter();
    writer.addWorksheet("Empty", []);

    const xlsx = writer.generate();
    const reader = new XlsxReader(xlsx);
    const result = await reader.readWithStylesAsync();

    expect(result.sheets[0].data).toEqual([]);
  });
});

describe("XlsxReader async methods", () => {
  it("should read back data with readAsync", async () => {
    const writer = new XlsxWriter();
    writer.addWorksheet("AsyncTest", [
      ["Name", "Age"],
      ["Alice", 30],
    ]);

    const xlsx = writer.generate();
    const reader = new XlsxReader(xlsx);
    const result = await reader.readAsync();

    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].name).toBe("AsyncTest");
    expect(result.sheets[0].data[0]).toEqual(["Name", "Age"]);
  });

  it("should read multiple sheets with readAsync", async () => {
    const writer = new XlsxWriter();
    writer.addWorksheet("Sheet1", [["A"]]);
    writer.addWorksheet("Sheet2", [["B"]]);

    const xlsx = writer.generate();
    const reader = new XlsxReader(xlsx);
    const result = await reader.readAsync();

    expect(result.sheets).toHaveLength(2);
  });
});

describe("XlsxWriter generateCompressed", () => {
  it("should generate compressed XLSX", async () => {
    const writer = new XlsxWriter();
    writer.addWorksheet("Compressed", [
      ["Header1", "Header2"],
      ["Value1", "Value2"],
    ]);

    const xlsx = await writer.generateCompressed();
    expect(xlsx).toBeInstanceOf(Uint8Array);
    expect(xlsx.length).toBeGreaterThan(0);
  });

  it("should produce smaller output for repetitive content", async () => {
    const writer = new XlsxWriter();
    const repetitiveData = Array(100).fill(["Same", "Data", "Repeated"]);
    writer.addWorksheet("Large", repetitiveData);

    const uncompressed = writer.generate();
    const compressed = await writer.generateCompressed();

    expect(compressed.length).toBeLessThan(uncompressed.length);
  });

  it("should be readable after compression", async () => {
    const writer = new XlsxWriter();
    writer.addWorksheet("Test", [
      ["Compressed", "Data"],
      [123, 456],
    ]);

    const xlsx = await writer.generateCompressed();
    const reader = new XlsxReader(xlsx);
    const result = await reader.readAsync();

    expect(result.sheets[0].data[0]).toEqual(["Compressed", "Data"]);
    expect(result.sheets[0].data[1]).toEqual([123, 456]);
  });
});
