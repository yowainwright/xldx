import { expect, it } from "bun:test";
import { runSizeAudit } from "../../../scripts/size/utils";
import { runExportBenchmarks } from "../../../scripts/benchmark/exports/index";

it("measures nonempty production consumer bundles", async () => {
  const measurements = await runSizeAudit();
  expect(measurements).toHaveLength(6);
  expect(measurements.every((row) => row.rawBytes > 0)).toBe(true);
});

it("measures validated plain exports, sampled widths, and small ZIP entries", async () => {
  const measurements = await runExportBenchmarks();
  expect(measurements.map((row) => row.workload)).toEqual([
    "numeric-1000",
    "strings-1000",
    "auto-width-1000",
    "numeric-10000",
    "strings-10000",
    "auto-width-10000",
    "zip-1000",
  ]);
  expect(measurements.every((row) => row.medianMs > 0 && row.p95Ms >= row.medianMs)).toBe(true);
}, 30000);
