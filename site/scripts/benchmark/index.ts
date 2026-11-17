import { log } from "node:console";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const bundle = await readFile(process.argv[2], "utf8");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const measurements = await page.evaluate(async (source) => {
    const blob = new Blob([source], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    try {
      const module = await import(url);
      return await module.runBenchmarks();
    } finally {
      URL.revokeObjectURL(url);
    }
  }, bundle);
  await saveReport(browser.version(), measurements);
} finally {
  await browser.close();
}

async function saveReport(runtime: string, measurements: unknown): Promise<void> {
  const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const fixtures = { exportRows: [1000, 10000], exportColumns: 1, widthSample: 100, zipEntries: 1000 };
  const report = { revision, runtime, fixtures, warmups: 5, samples: 30, measurements };
  const directory = resolve(process.env.REPORT_DIR || "tmp/module-current");
  await mkdir(directory, { recursive: true });
  const json = JSON.stringify(report, null, 2);
  await writeFile(resolve(directory, "browser.json"), json);
  log(json);
}
