import { expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
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
const offsetWrite = `
  import { Xldx } from "xldx";
  import { readFile } from "node:fs/promises";
  const book = new Xldx([]);
  book.toUint8Array = async () => Uint8Array.of(99, 80, 75, 88).subarray(1, 3);
  book.toBuffer = async () => { throw new Error("Unexpected Buffer copy"); };
  await book.write(process.argv[1]);
  const bytes = await readFile(process.argv[1]);
  process.stdout.write(JSON.stringify(Array.from(bytes)));
`;

const schemaAliases = `
  import type * as API from "PACKAGE";
  type Previous = [
    API.FontStyleSchema, API.FillStyleSchema, API.BorderStyleSchema,
    API.BordersStyleSchema, API.AlignmentStyleSchema, API.CellStyleSchema,
    API.PatternContextSchema, API.PatternFunctionSchema, API.ColumnPatternSchema,
    API.RowStyleOverrideSchema, API.ColumnDefinitionSchema,
    API.SheetOptionsSchema, API.XldxOptionsSchema,
  ];
  type Current = [
    API.FontStyle, API.FillStyle, API.BorderStyle,
    API.BordersStyle, API.AlignmentStyle, API.CellStyle,
    API.PatternContext, API.PatternFunction, API.ColumnPattern,
    API.RowStyleOverride, API.ColumnDefinition, API.SheetOptions, API.XldxOptions,
  ];
  declare const previous: Previous;
  declare const current: Current;
  export const restored: Current = previous;
  export const compatible: Previous = current;
`;

it.each([
  ["xldx", "nodenext"],
  ["xldx/browser", "bundler"],
])("preserves public schema type aliases for %s consumers", (entry, resolution) => {
  const source = schemaAliases.replace("PACKAGE", entry);
  expect(checkTypes(source, resolution)).toBe("");
});

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

it("writes offset views through the package entry in native Node", () => {
  mkdirSync("tmp", { recursive: true });
  const directory = mkdtempSync("tmp/write-consumer-");
  const file = join(directory, "archive.xlsx");
  try {
    const args = ["--input-type=module", "--eval", offsetWrite, file];
    const result = spawnSync("node", args, { encoding: "utf8" });
    expect(result.error).toBeUndefined();
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("[80,75]");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
