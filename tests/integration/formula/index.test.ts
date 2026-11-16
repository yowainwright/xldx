import { expect, test } from "bun:test";
import { XlsxReader, XlsxWriter } from "../../../src/xlsx/index";
import { MiniUnzip, MiniZip } from "../../../src/zip/index";
import { Xldx } from "../../../src/index";
import manifest from "../../../fixtures/formula/manifest.json";

test.each(["MYSEQUENCE(1)", "OTHER.SEQUENCE(1)", "MY_xlfn.SEQUENCE(1)", "éSEQUENCE(1)"])(
  "preserves the complete unsupported function name on export: %s",
  async (formula) => {
    const writer = new XlsxWriter();
    writer.addWorksheet("Data", [[{ formula }]]);
    const bytes = writer.generate();
    const xml = new MiniUnzip(bytes).getFile("xl/worksheets/sheet1.xml");
    expect(xml).toContain(`<f>${formula}</f>`);
    const imported = await Xldx.read(bytes);
    expect(imported.sheets[0].data[0][0]).toEqual({ formula });
  },
);

const date = new Date(2024, 0, 1);
const font = { bold: true };
const style = { font };
const styledNumber = { value: 2, style };
const styledDate = { value: date };

test.each([{ value: 2 }, styledNumber, date, styledDate])(
  "references values consistently with XLSX encoding: %j",
  async (source) => {
    const writer = new XlsxWriter();
    writer.addWorksheet("Data", [[source]]);
    const encoded = new XlsxReader(writer.generate()).read().sheets[0].data[0][0];
    expect(typeof encoded).toBe("number");
    const result = Number(encoded) * 2;
    const data = [[source, { formula: "A1*2" }]];
    const sheets = [{ name: "Data", data }];
    const book = Xldx.fromJSON({ sheets });
    const expected = { formula: "A1*2", result };
    expect(book.calculate().workbook.sheets[0].data[0][1]).toEqual(expected);
    const exported = await Xldx.read(await book.toUint8Array());
    expect(exported.sheets[0].data[0]).toEqual([encoded, expected]);
  },
);

test("preserves standalone Excel errors and propagates them through references", async () => {
  const zip = new MiniZip();
  zip.addFile("xl/workbook.xml", '<workbook><sheets><sheet name="Data"/></sheets></workbook>');
  const xml =
    '<worksheet><sheetData><row r="1"><c r="A1" t="e"><v>#DIV/0!</v></c><c r="B1"><f>A1</f><v>0</v></c><c r="C1"><f>SUM(A1:A1)</f><v>0</v></c></row></sheetData></worksheet>';
  zip.addFile("xl/worksheets/sheet1.xml", xml);
  const book = Xldx.fromJSON(await Xldx.read(zip.generate()));
  const result = { error: "#DIV/0!" };
  const expected = [result, { formula: "A1", result }, { formula: "SUM(A1:A1)", result }];
  expect(book.calculate().workbook.sheets[0].data[0]).toEqual(expected);
  const exported = await Xldx.read(await book.toUint8Array());
  expect(exported.sheets[0].data[0]).toEqual(expected);
});

test("reads independent Excel caches and recalculates supported expressions", async () => {
  const fixture = Bun.file(
    new URL("../../../fixtures/formula/excel-results.xlsx", import.meta.url),
  );
  const bytes = new Uint8Array(await fixture.arrayBuffer());
  const imported = await Xldx.read(bytes);
  const cells = imported.sheets[0].data;
  expect(cells[0][0]).toEqual(manifest.expected.A1);
  expect(cells[1][0]).toEqual(manifest.expected.A2);
  expect(cells[2][0]).toEqual(manifest.expected.A3);
  expect(cells[3][0]).toEqual(manifest.expected.A4);
  expect(cells[11][0]).toEqual(manifest.expected.A12);
  const book = Xldx.fromJSON(imported);
  const exported = await Xldx.read(await book.toUint8Array());
  expect(exported.sheets[0].data[0][0]).toEqual({ formula: "1+1", result: 2 });
  expect(exported.sheets[0].data[2][0]).toEqual({ formula: "IF(B3,FALSE,TRUE)" });
  expect(exported.sheets[0].data[11][0]).toEqual(manifest.expected.A12);
});

test.each([0, false, "", "#REF!", { error: "#DIV/0!" }])(
  "preserves typed formula cache %j",
  (result) => {
    const cell = { formula: 'SUM(1,2)+N("<&")', result };
    const writer = new XlsxWriter();
    writer.addWorksheet("Data", [[cell]]);
    const bytes = writer.generate();
    const xml = new MiniUnzip(bytes).getFile("xl/worksheets/sheet1.xml");
    expect(xml).toContain("<f>SUM(1,2)+N(&quot;&lt;&amp;&quot;)</f>");
    expect(new XlsxReader(bytes).read().sheets[0].data[0][0]).toEqual(cell);
  },
);

test("preserves a formula without inventing a missing cache", () => {
  const writer = new XlsxWriter();
  writer.addWorksheet("Data", [[{ formula: "AVERAGE(A2:A5)" }]]);
  const bytes = writer.generate();
  const xml = new MiniUnzip(bytes).getFile("xl/worksheets/sheet1.xml");
  expect(xml).toContain("<f>AVERAGE(A2:A5)</f>");
  expect(xml).not.toContain("<v>");
  expect(new XlsxReader(bytes).read().sheets[0].data[0][0]).toEqual({ formula: "AVERAGE(A2:A5)" });
});

test.each(["shared", "array", "dataTable"])("rejects unsupported %s formulas", (type) => {
  const zip = new MiniZip();
  zip.addFile("xl/workbook.xml", '<workbook><sheets><sheet name="Data"/></sheets></workbook>');
  const xml = `<worksheet><sheetData><row r="1"><c s="1" r="A1"><f t="${type}">1+1</f><v>2</v></c></row></sheetData></worksheet>`;
  zip.addFile("xl/worksheets/sheet1.xml", xml);
  expect(() => new XlsxReader(zip.generate()).read()).toThrow("Unsupported formula encoding");
});

test("rejects compressed ZIP records instead of decoding compressed bytes as XML", () => {
  const zip = new MiniZip();
  zip.addFile("a.xml", "content");
  const bytes = zip.generate();
  const view = new DataView(bytes.buffer);
  view.setUint16(8, 8, true);
  expect(() => new MiniUnzip(bytes).getFile("a.xml")).toThrow("Unsupported ZIP compression");
});
