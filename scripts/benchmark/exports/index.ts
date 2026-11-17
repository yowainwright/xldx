import { Xldx } from "../../../src/index";
import { MiniZip, MiniUnzip } from "../../../src/zip/index";
import { measure } from "../utils";
import type { Measurement } from "../types";

export async function runExportBenchmarks(): Promise<Measurement[]> {
  const results: Measurement[] = [];
  const fixtures = [1000, 10000].flatMap(exportFixtures);
  for (const { count, kind } of fixtures) {
    results[results.length] = await measureExport(count, kind);
  }
  const zip = await measureZip();
  results[results.length] = zip;
  return results;
}

async function measureExport(count: number, kind: string): Promise<Measurement> {
  const numeric = kind === "numeric";
  const data = Array.from({ length: count }, (_, index) => {
    const value = numeric ? index : `unique-${index}`;
    const row = { value };
    return row;
  });
  const book = new Xldx(data);
  const width = kind === "auto-width" ? "auto" : undefined;
  book.createSheet({ name: "Data" }, { key: "value", width });
  const name = `${kind}-${count}`;
  const result = await measure(name, "export-including-calculation", () => book.toUint8Array());
  const bytes = await book.toUint8Array();
  const restored = await Xldx.read(bytes);
  const rows = restored.sheets[0].data;
  const valid = rows.length === count + 1 && rows[count][0] === data[count - 1].value;
  if (!valid) throw new Error(`Incorrect export fixture: ${name}`);
  return result;
}

async function measureZip(): Promise<Measurement> {
  const zip = new MiniZip();
  Array.from({ length: 1000 }, (_, index) => zip.addFile(`${index}.txt`, `entry-${index}`));
  const result = await measure("zip-1000", "generate", () => zip.generate());
  const archive = new MiniUnzip(zip.generate());
  const valid = archive.listFiles().length === 1000 && archive.getFile("999.txt") === "entry-999";
  if (!valid) throw new Error("Incorrect ZIP fixture");
  return result;
}

function exportFixtures(count: number) {
  const fixtures = ["numeric", "strings", "auto-width"].map((kind) => {
    const fixture = { count, kind };
    return fixture;
  });
  return fixtures;
}
