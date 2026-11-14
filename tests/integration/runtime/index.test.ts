import { expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { checkTypes } from "./utils.test";

const browser = `
  import { Xldx } from "xldx/browser";
  delete globalThis.Buffer;
  const book = new Xldx([{ value: 42 }]);
  book.createSheet({ name: "Data" }, { key: "value" });
  const blob = await book.toBlob();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  console.log(JSON.stringify(await Xldx.read(bytes)));
`;
const server = `
  import { Xldx } from "xldx";
  const book = new Xldx([{ value: 42 }]);
  book.createSheet({ name: "Data" }, { key: "value" });
  const bytes = await book.toBuffer();
  const view = Buffer.concat([Buffer.alloc(8), bytes]).subarray(8);
  console.log(JSON.stringify(await Xldx.read(view)));
`;

it("exposes Node methods to NodeNext TypeScript consumers", () => {
  const source = 'import { Xldx } from "xldx"; new Xldx([]).toBuffer();';
  expect(checkTypes(source, "nodenext")).toBe("");
});

it("exposes browser methods to bundler TypeScript consumers", () => {
  const source = 'import { Xldx } from "xldx/browser"; new Xldx([]).toBlob();';
  expect(checkTypes(source, "bundler")).toBe("");
});

it.each([
  ["browser bundle without Node globals", browser],
  ["Node package entry with a Buffer view", server],
])("roundtrips the %s in native Node", (_, script) => {
  const args = ["--input-type=module", "--eval", script];
  const result = spawnSync("node", args, { encoding: "utf8" });
  expect(result.error).toBeUndefined();
  expect(result.stderr).toBe("");
  expect(result.status).toBe(0);
  const workbook = JSON.parse(result.stdout);
  expect(workbook.sheets[0].data).toEqual([["value"], [42]]);
});
