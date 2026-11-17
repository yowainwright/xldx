import { log } from "node:console";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { runSizeAudit } from "./utils";

const measurements = await runSizeAudit();
const packed = execFileSync("npm", ["pack", "--dry-run", "--ignore-scripts", "--json"], {
  encoding: "utf8",
});
const [archive] = JSON.parse(packed);
const { size: packedBytes, unpackedSize: unpackedBytes } = archive;
const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const { version: bun } = Bun;
const report = { revision, bun, measurements, packedBytes, unpackedBytes };
const directory = process.env.REPORT_DIR || "tmp/module-current";
await mkdir(directory, { recursive: true });
const json = JSON.stringify(report, null, 2);
await writeFile(resolve(directory, "size.json"), json);
log(json);
