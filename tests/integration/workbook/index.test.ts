import { expect, it } from "bun:test";
import { Xldx, type Workbook } from "../../../src/index";

it("recalculates chained formulas after addressed and exposed-row edits", () => {
  const data = [
    ["input", "double", "chain"],
    [2, { formula: "A2*2" }, { formula: "B2+1" }],
  ];
  const sheets = [{ name: "Data", data }];
  const book = Xldx.fromJSON({ sheets });
  const sheet = book.getSheetData("Data");
  sheet.updateCellData("A2", 3);
  expect(book.calculate().workbook.sheets[0].data[1]).toEqual([
    3,
    { formula: "A2*2", result: 6 },
    { formula: "B2+1", result: 7 },
  ]);
  sheet.getRowsData()[0]["0"] = 5;
  expect(book.calculate().workbook.sheets[0].data[1][2]).toEqual({ formula: "B2+1", result: 11 });
  sheet.updateCellData("A1", "renamed");
  expect(book.toJSON().sheets[0].data[0][0]).toBe("renamed");
  expect(() => sheet.updateCellData("Z99", 1)).toThrow(RangeError);
});

it("exports fresh formula results while preserving literal strings and raw JSON", async () => {
  const data = [[2, { formula: "A1*2", result: 999 }, "=1+1"]];
  const sheets = [{ name: "Data", data }];
  const book = Xldx.fromJSON({ sheets });
  const exported = await Xldx.read(await book.toUint8Array());
  expect(exported.sheets[0].data[0]).toEqual([2, { formula: "A1*2", result: 4 }, "=1+1"]);
  expect(book.toJSON().sheets[0].data).toEqual(data);
  const restored = Xldx.fromJSON(JSON.parse(JSON.stringify(book)));
  restored.getSheetData("Data").updateCellData("A1", 3);
  expect(restored.calculate().workbook.sheets[0].data[0][1]).toEqual({
    formula: "A1*2",
    result: 6,
  });
});

it("exports row edits made after an earlier export", async () => {
  const book = new Xldx([{ value: 1 }]);
  book.createSheet({ name: "Data" }, { key: "value" });
  await book.toUint8Array();
  book.getSheetData("Data").updateRowData(0, { value: 2 });
  const exported = await Xldx.read(await book.toUint8Array());
  expect(exported.sheets[0].data).toEqual([["value"], [2]]);
});

it("exports updated columns from every sheet", async () => {
  const book = new Xldx([{ value: 1 }]);
  book.createSheet({ name: "First" }, { key: "value" });
  book.createSheet({ name: "Second" }, { key: "value" });
  book.getSheetData("Second").updateColumnData("value", [3]);
  const exported = await Xldx.read(await book.toUint8Array());
  expect(exported.sheets.map((sheet) => sheet.data)).toEqual([
    [["value"], [3]],
    [["value"], [3]],
  ]);
});

it("replaces a sheet consistently when its name is reused", async () => {
  const book = new Xldx([{ first: 1, second: 2 }]);
  book.createSheet({ name: "Data" }, { key: "first" });
  book.createSheet({ name: "Data" }, { key: "second" });
  const exported = await Xldx.read(await book.toUint8Array());
  const data = [["second"], [2]];
  expect(exported.sheets).toEqual([{ name: "Data", data }]);
});

it("restores JSON sheets and preserves their data and widths", () => {
  const data = [
    ["Name", "Age"],
    ["Alice", 30],
  ];
  const columnWidths = [24, 12];
  const sheets = [{ name: "People", data, columnWidths }];
  const original: Workbook = { sheets };
  const restored = Xldx.fromJSON(original);
  expect(restored.toJSON()).toEqual(original);
  expect(restored.getSheetData("People").getRowsData()).toHaveLength(1);
});

it("exports edits to restored sheets", async () => {
  const data = [["Value"], [1]];
  const sheets = [{ name: "Data", data }];
  const restored = Xldx.fromJSON({ sheets });
  restored.getSheetData("Data").updateColumnData("0", [4]);
  const exported = await Xldx.read(await restored.toUint8Array());
  expect(exported.sheets[0].data).toEqual([["Value"], [4]]);
});

it("preserves empty sheets and duplicate or non-string headers when restoring JSON", () => {
  const empty: unknown[][] = [];
  const data = [
    ["Same", "Same", 42, ""],
    [1, 2, 3, 4],
  ];
  const sheets = [
    { name: "Empty", data: empty },
    { name: "Headers", data },
  ];
  const original: Workbook = { sheets };
  const restored = Xldx.fromJSON(original);
  expect(restored.toJSON()).toEqual(original);
});
