import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { Xldx } from "../../../src/server/index";
import { measure } from "../utils";
import type { Measurement } from "../types";

export async function measureWrites(): Promise<Measurement[]> {
  await mkdir("tmp", { recursive: true });
  const directory = await mkdtemp("tmp/write-bench-");
  const book = new Xldx(Array.from({ length: 10000 }, (_, value) => ({ value })));
  book.createSheet({ name: "Data" }, { key: "value" });
  const bytes = await book.toUint8Array();
  book.toUint8Array = async () => bytes;
  const file = join(directory, "archive.xlsx");
  try {
    const result = await measure("write-10000", "write-prebuilt-archive", () => book.write(file));
    const actual = await readFile(file);
    if (!actual.equals(bytes)) throw new Error("Incorrect write fixture");
    const measurements = [result];
    return measurements;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
