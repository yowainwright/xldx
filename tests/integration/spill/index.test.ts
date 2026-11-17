import { expect, test } from "bun:test";
import { Xldx } from "../../../src/index";
import { MiniUnzip } from "../../../src/zip/index";
import { XlsxWriter } from "../../../src/xlsx/index";

function workbook(formula: string, tail: unknown[][] = []) {
  const data = [[{ formula }], ...tail];
  const sheets = [{ name: "Data", data }];
  const book = Xldx.fromJSON({ sheets });
  return book;
}

test.each([
  ["1/(SEQUENCE(1,3)-2)", [-1, { error: "#DIV/0!" }, 1]],
  ["1/(SEQUENCE(1,3)-1)", [{ error: "#DIV/0!" }, 1, 0.5]],
  ["(1/(SEQUENCE(1,3)-2))*2", [-2, { error: "#DIV/0!" }, 2]],
  ['MID("abc",SEQUENCE(1,3,0),1)', [{ error: "#VALUE!" }, "a", "b"]],
])(
  "preserves individual array errors through calculation and export: %s",
  async (formula, values) => {
    const book = workbook(String(formula));
    const [result, ...tail] = values;
    const expected = [{ formula, result }, ...tail];
    const calculated = book.calculate().workbook.sheets[0];
    expect(calculated.data[0]).toEqual(expected);
    expect(calculated.spills).toEqual([{ row: 0, column: 0, rows: 1, columns: 3 }]);
    const imported = await Xldx.read(await book.toUint8Array());
    expect(imported.sheets[0].data[0]).toEqual(expected);
    expect(Xldx.fromJSON(imported).calculate().workbook.sheets[0].data[0]).toEqual(expected);
  },
);

test.each(["B1*2", "SUM(A1:C1)", "SUM(1/(SEQUENCE(1,3)-2))"])(
  "propagates array cell errors into %s",
  (formula) => {
    const anchor = { formula: "1/(SEQUENCE(1,3)-2)" };
    const reference = { formula };
    const data = [[anchor, null, null, reference]];
    const sheets = [{ name: "Data", data }];
    const book = Xldx.fromJSON({ sheets });
    const result = { error: "#DIV/0!" };
    expect(book.calculate().workbook.sheets[0].data[0][3]).toEqual({
      formula,
      result,
    });
  },
);

test("one SEQUENCE formula spills a rectangular grid without changing source cells", () => {
  const book = workbook("SEQUENCE(2,3)");
  const actual = book.calculate();
  expect(actual.issues).toEqual([]);
  expect(actual.workbook.sheets[0].data).toEqual([
    [{ formula: "SEQUENCE(2,3)", result: 1 }, 2, 3],
    [4, 5, 6],
  ]);
  expect(book.toJSON().sheets[0].data).toEqual([[{ formula: "SEQUENCE(2,3)" }]]);
});

test("unrelated speculative spills do not create cycles or cache blank dependencies", async () => {
  const first = { formula: "SEQUENCE(1,2,D2)" };
  const second = { formula: "SEQUENCE(1,2,B1)" };
  const data = [[first, null, second]];
  const sheets = [{ name: "Data", data }];
  const book = Xldx.fromJSON({ sheets });
  const expected = [{ ...first, result: 0 }, 1, { ...second, result: 1 }, 2];
  const calculated = book.calculate();
  expect(calculated.issues).toEqual([]);
  expect(calculated.workbook.sheets[0].data[0]).toEqual(expected);
  const imported = await Xldx.read(await book.toUint8Array());
  expect(imported.sheets[0].data[0]).toEqual(expected);
});

test("array errors preserve neighboring cells and produce a diagnostic", () => {
  const calculated = workbook("1/(SEQUENCE(1,3)-2)").calculate();
  expect(calculated.workbook.sheets[0].data[0][2]).toBe(1);
  expect(calculated.issues).toEqual([
    { sheet: "Data", cell: "A1", code: "divide-by-zero", message: "#DIV/0!" },
  ]);
});

test.each([
  ["1/(SEQUENCE(1,3)-2)", "B1"],
  ["1/(SEQUENCE(1,3)-1)", "A1"],
])("reports the anchor and direct reference errors: %s, %s", async (formula, reference) => {
  const anchor = { formula };
  const dependent = { formula: reference };
  const data = [[anchor, null, null, dependent]];
  const sheets = [{ name: "Data", data }];
  const book = Xldx.fromJSON({ sheets });
  const calculated = book.calculate();
  expect(calculated.issues.map((issue) => issue.cell)).toEqual(["A1", "D1"]);
  expect(calculated.issues.map((issue) => issue.code)).toEqual([
    "divide-by-zero",
    "divide-by-zero",
  ]);
  const result = { error: "#DIV/0!" };
  expect(calculated.workbook.sheets[0].data[0][3]).toEqual({ ...dependent, result });
  const exported = await Xldx.read(await book.toUint8Array());
  expect(exported.sheets[0].data[0][3]).toEqual({ ...dependent, result });
});

test.each([
  { formula: "SEQUENCE(1000)", start: 1 },
  { formula: "SEQUENCE(1000,1,AA1)", start: 0 },
])("bounds repeated speculative work for %j", async ({ formula, start }) => {
  const first = { formula: "SEQUENCE(1,2,SUM(Z1:Z100))" };
  const second = { formula };
  const data = [[first, null, second]];
  const sheets = [{ name: "Data", data }];
  const book = Xldx.fromJSON({ sheets });
  const calculated = book.calculate();
  expect(calculated.issues).toEqual([]);
  expect(calculated.workbook.sheets[0].data[0]).toEqual([
    { ...first, result: 0 },
    1,
    { ...second, result: start },
  ]);
  const last = start + 999;
  expect(calculated.workbook.sheets[0].data[999][2]).toBe(last);
  const imported = await Xldx.read(await book.toUint8Array());
  expect(imported.sheets[0].data[999][2]).toBe(last);
  expect(imported.sheets[0].data[0][0]).toEqual({ ...first, result: 0 });
});

test("keeps cycle detection when a speculative spill actually supplies the dependency", () => {
  const first = { formula: "SEQUENCE(1,2,D1)" };
  const second = { formula: "SEQUENCE(1,2,B1)" };
  const data = [[first, null, second]];
  const sheets = [{ name: "Data", data }];
  const calculated = Xldx.fromJSON({ sheets }).calculate();
  const result = { error: "#REF!" };
  expect(calculated.workbook.sheets[0].data[0][0]).toEqual({
    ...first,
    result,
  });
  expect(calculated.issues[0].code).toBe("cycle");
});

test("MID maps over a SEQUENCE array using standard formula syntax", () => {
  const actual = workbook('MID("101001",SEQUENCE(2,3),1)').calculate();
  expect(actual.issues).toEqual([]);
  expect(actual.workbook.sheets[0].data).toEqual([
    [{ formula: 'MID("101001",SEQUENCE(2,3),1)', result: "1" }, "0", "1"],
    ["0", "0", "1"],
  ]);
});

test.each([
  ["SEQUENCE(1,3)*2", [2, 4, 6]],
  ["-SEQUENCE(1,3)", [-1, -2, -3]],
  ["SUM(SEQUENCE(2,3))", [21]],
  ['MID("Hello",2,3)', ["ell"]],
])("calculates %s", (formula, values) => {
  const result = workbook(String(formula)).calculate();
  expect(result.issues).toEqual([]);
  const [value] = values;
  const first = { formula, result: value };
  expect(result.workbook.sheets[0].data[0]).toEqual([first, ...values.slice(1)]);
});

test.each(["SEQUENCE(100001)", "SEQUENCE(1000)+SEQUENCE(1,1000)"])(
  "bounds oversized array calculation %s",
  (formula) => {
    const result = workbook(formula).calculate();
    expect(result.issues[0].code).toBe("limit");
    expect(result.workbook.sheets[0].spills).toBeUndefined();
  },
);

test("occupied cells block a spill without being overwritten", () => {
  const actual = workbook("SEQUENCE(2)", [[99]]).calculate();
  const result = { error: "#SPILL!" };
  expect(actual.workbook.sheets[0].data).toEqual([[{ formula: "SEQUENCE(2)", result }], [99]]);
  expect(actual.issues[0].code).toBe("spill");
});

test("edits resize the spill and remove old results", () => {
  const book = workbook("SEQUENCE(2,3)");
  book.calculate();
  book.getSheetData(0).updateCellData("A1", { formula: "SEQUENCE(1,2,5,2)" });
  expect(book.calculate().workbook.sheets[0].data).toEqual([
    [{ formula: "SEQUENCE(1,2,5,2)", result: 5 }, 7],
  ]);
});

test("references read spilled values even before their anchor in calculation order", () => {
  const data = [[{ formula: "D2*2" }, null, { formula: "SEQUENCE(2,2)" }]];
  const sheets = [{ name: "Data", data }];
  const book = Xldx.fromJSON({ sheets });
  expect(book.calculate().workbook.sheets[0].data[0][0]).toEqual({ formula: "D2*2", result: 8 });
});

test("array parameters can depend on a spill anchored later in the sheet", () => {
  const data = [[{ formula: "SEQUENCE(1,2,D2)" }, null, { formula: "SEQUENCE(2,2)" }]];
  const sheets = [{ name: "Data", data }];
  const result = Xldx.fromJSON({ sheets }).calculate();
  expect(result.issues).toEqual([]);
  expect(result.workbook.sheets[0].data[0][0]).toEqual({ formula: "SEQUENCE(1,2,D2)", result: 4 });
});

test("a formula cannot read its own spilled result as an input", () => {
  const result = workbook("SEQUENCE(2,2,B2)").calculate();
  expect(result.issues[0].code).toBe("cycle");
  expect(result.workbook.sheets[0].spills).toBeUndefined();
});

test("XLSX retains one array formula, its spill range, metadata, and editable source", async () => {
  const book = workbook('MID("101001",SEQUENCE(2,3),1)');
  const bytes = await book.toUint8Array();
  const zip = new MiniUnzip(bytes);
  const xml = zip.getFile("xl/worksheets/sheet1.xml");
  expect(xml).toContain('t="array" ref="A1:C2"');
  expect(xml).toContain("_xlfn.SEQUENCE(2,3)");
  expect(zip.getFile("xl/metadata.xml")).toContain("dynamicArrayProperties");
  const restored = Xldx.fromJSON(await Xldx.read(bytes));
  expect(restored.calculate().workbook).toEqual(book.calculate().workbook);
  restored.getSheetData(0).updateCellData("A1", { formula: "SEQUENCE(1,2)" });
  expect(restored.calculate().issues).toEqual([]);
  expect(restored.calculate().workbook.sheets[0].data[1].every((cell) => cell === null)).toBe(true);
});

test.each(["SORT(A3:A4)", "SEQUENCE(0,2)"])(
  "rejects restoring an imported array it cannot recalculate: %s",
  async (formula) => {
    const writer = new XlsxWriter();
    const anchor = { formula, result: 1 };
    const data = [[anchor], [2], [2], [1]];
    const range = { row: 0, column: 0, rows: 2, columns: 1 };
    writer.addWorksheet("Data", data, undefined, [range]);
    const imported = await Xldx.read(writer.generate());
    expect(() => Xldx.fromJSON(imported)).toThrow(TypeError);
    expect(imported.sheets[0].data[1][0]).toBe(2);
    expect(imported.sheets[0].spills).toEqual([range]);
  },
);
