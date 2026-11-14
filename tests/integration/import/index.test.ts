import { expect, it } from "bun:test";
import { Xldx } from "../../../src/index";

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
