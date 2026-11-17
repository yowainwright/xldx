import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function checkTypes(source: string, resolution: string): string {
  mkdirSync("tmp", { recursive: true });
  const directory = mkdtempSync("tmp/consumer-");
  const file = join(directory, "index.mts");
  try {
    writeFileSync(file, source);
    const isBundler = resolution === "bundler";
    const module = isBundler ? "esnext" : resolution;
    const flags = "--ignoreConfig --noEmit --strict --target esnext --types node";
    const args = flags
      .split(" ")
      .concat(["--module", module, "--moduleResolution", resolution, file]);
    const result = spawnSync("node_modules/.bin/tsc", args, { encoding: "utf8" });
    if (result.error) throw result.error;
    const output = result.stdout + result.stderr;
    return output;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
