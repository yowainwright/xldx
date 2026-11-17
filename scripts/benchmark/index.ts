import { measure, workbookFor, workloads } from "./utils";
import type { Measurement, Workload } from "./types";

export async function runBenchmarks(): Promise<Measurement[]> {
  const results: Measurement[] = [];
  for (const workload of workloads()) {
    const measurements = await benchmark(workload);
    results[results.length] = measurements[0];
    results[results.length] = measurements[1];
    results[results.length] = measurements[2];
  }
  return results;
}

async function benchmark(workload: Workload): Promise<Measurement[]> {
  const book = workbookFor(workload);
  const calculate = await measure(workload.name, "calculate", () => book.calculate());
  const edit = await measure(workload.name, "edit-and-calculate", () => {
    book.getSheetData(0).updateCellData("A1", 2);
    const calculation = book.calculate();
    return calculation;
  });
  const exportResult = await measure(workload.name, "export-including-calculation", () =>
    book.toUint8Array(),
  );
  const results = [calculate, edit, exportResult];
  return results;
}
