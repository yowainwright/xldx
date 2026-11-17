import { expect, it } from "bun:test";
import { Xldx } from "../../../src/index";

it("restores JSON-persisted imports with blank leading and intermediate rows", async () => {
  const data = [[], [1], [], [3]];
  const sheets = [{ name: "Data", data }];
  const original = Xldx.fromJSON({ sheets });
  const imported = await Xldx.read(await original.toUint8Array());
  const persisted = JSON.parse(JSON.stringify(imported));
  expect(persisted.sheets[0].data[0]).toBeNull();
  expect(persisted.sheets[0].data[2]).toBeNull();
  const restored = Xldx.fromJSON(persisted);
  restored.getSheetData(0).updateCellData("A3", 2);
  const exported = await Xldx.read(await restored.toUint8Array());
  expect(exported.sheets[0].data[1]).toEqual([1]);
  expect(exported.sheets[0].data[2]).toEqual([2]);
  expect(exported.sheets[0].data[3]).toEqual([3]);
});

it("restores JSON-persisted array formulas after a blank leading row", async () => {
  const formula = "SEQUENCE(2,2)";
  const data = [[], [{ formula }], [], [9]];
  const sheets = [{ name: "Data", data }];
  const original = Xldx.fromJSON({ sheets });
  const imported = await Xldx.read(await original.toUint8Array());
  const persisted = JSON.parse(JSON.stringify(imported));
  expect(persisted.sheets[0].data[0]).toBeNull();
  const restored = Xldx.fromJSON(persisted).calculate();
  expect(restored.issues).toEqual([]);
  expect(restored.workbook.sheets[0].data[1]).toEqual([{ formula, result: 1 }, 2]);
  expect(restored.workbook.sheets[0].data[2]).toEqual([3, 4]);
  expect(restored.workbook.sheets[0].data[3]).toEqual([9]);
});

it("restores reader output containing blank cells", async () => {
  const book = new Xldx([{ first: null, second: 2 }]);
  book.createSheet({ name: "Data" }, { key: "first" }, { key: "second" });
  const original = await Xldx.read(await book.toUint8Array());
  const restored = Xldx.fromJSON(original);
  const exported = await Xldx.read(await restored.toUint8Array());
  expect(exported).toEqual(original);
});

it("preserves blank leading and intermediate worksheet rows", async () => {
  const data: unknown[][] = [[], [1], [], [2]];
  const sheets = [{ name: "Data", data }];
  const book = Xldx.fromJSON({ sheets });
  const original = await Xldx.read(await book.toUint8Array());
  const restored = Xldx.fromJSON(original);
  const exported = await Xldx.read(await restored.toUint8Array());
  expect(exported).toEqual(original);
  expect(exported.sheets[0].data[1]).toEqual([1]);
  expect(exported.sheets[0].data[3]).toEqual([2]);
});

it("edits an imported blank row by cell address", async () => {
  const data = [[1], [], [3]];
  const sheets = [{ name: "Data", data }];
  const original = Xldx.fromJSON({ sheets });
  const imported = await Xldx.read(await original.toUint8Array());
  const restored = Xldx.fromJSON(imported);
  restored.getSheetData(0).updateCellData("A2", 2);
  const exported = await Xldx.read(await restored.toUint8Array());
  expect(exported.sheets[0].data).toEqual([[1], [2], [3]]);
});

it("updates a column across an imported blank row", async () => {
  const data = [[1], [], [3]];
  const sheets = [{ name: "Data", data }];
  const original = Xldx.fromJSON({ sheets });
  const imported = await Xldx.read(await original.toUint8Array());
  const restored = Xldx.fromJSON(imported);
  restored.getSheetData(0).updateColumnData("0", [2, 4]);
  const exported = await Xldx.read(await restored.toUint8Array());
  expect(exported.sheets[0].data).toEqual([[1], [2], [4]]);
});
