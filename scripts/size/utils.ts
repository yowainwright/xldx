import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync, brotliCompressSync } from "node:zlib";
import type { BundleMeasurement } from "./types";

const consumers = [
  [
    "full",
    'import { Xldx } from "xldx"; const b = new Xldx([{v:42}]); b.createSheet({name:"Data"},{key:"v"}); export default (await b.toUint8Array()).length > 0;',
  ],
  [
    "formula",
    'import { Formula } from "xldx"; export default Formula.multiply(2,3).formula === "(2)*(3)";',
  ],
  [
    "theme",
    'import { darkTheme } from "xldx"; export default typeof darkTheme.primary === "string";',
  ],
];
const targets: BundleMeasurement["target"][] = ["browser", "node"];

export async function runSizeAudit(): Promise<BundleMeasurement[]> {
  await mkdir("tmp", { recursive: true });
  const directory = await mkdtemp("tmp/size-");
  const measurements: BundleMeasurement[] = [];
  const fixtures = targets.flatMap(consumerFixtures);
  try {
    for (const { consumer, source, target } of fixtures) {
      measurements[measurements.length] = await measureConsumer(
        directory,
        consumer,
        source,
        target,
      );
    }
    return measurements;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function measureConsumer(
  directory: string,
  consumer: string,
  source: string,
  target: BundleMeasurement["target"],
): Promise<BundleMeasurement> {
  const entry = resolve(directory, `${consumer}.ts`);
  await writeFile(entry, source);
  const entrypoints = [entry];
  const build = await Bun.build({ entrypoints, target, minify: true, metafile: true });
  if (!build.success) throw new AggregateError(build.logs, "Consumer build failed");
  const bytes = new Uint8Array(await build.outputs[0].arrayBuffer());
  executeConsumer(bytes);
  const { byteLength: rawBytes } = bytes;
  const gzipBytes = gzipSync(bytes).byteLength;
  const brotliBytes = brotliCompressSync(bytes).byteLength;
  const retainedInputs = retainedFiles(build);
  const measurement = { consumer, target, rawBytes, gzipBytes, brotliBytes, retainedInputs };
  return measurement;
}

function executeConsumer(bytes: Uint8Array): void {
  const encoded = Buffer.from(bytes).toString("base64");
  const url = `data:text/javascript;base64,${encoded}`;
  const script = `import value from ${JSON.stringify(url)}; if (value !== true) throw new Error("Invalid consumer output");`;
  const result = spawnSync("node", ["--input-type=module", "--eval", script], { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr);
}

function retainedFiles(build: Bun.BuildOutput): string[] {
  if (!build.metafile) throw new Error("Missing build metafile");
  const entries = Object.values(build.metafile.outputs).flatMap((output) =>
    Object.entries(output.inputs),
  );
  const retained = entries.filter(([, input]) => input.bytesInOutput > 0);
  const paths = retained.map(([path]) => path);
  const files = Array.from(new Set(paths)).sort();
  return files;
}

function consumerFixtures(target: BundleMeasurement["target"]) {
  const fixtures = consumers.map(([consumer, source]) => {
    const fixture = { consumer, source, target };
    return fixture;
  });
  return fixtures;
}
