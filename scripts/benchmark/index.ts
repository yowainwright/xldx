import { measure, workbookFor, workloads } from "./utils";
import type { Xldx } from "../../src/index";
import type { Measurement, Workload } from "./types";
import { runExportBenchmarks } from "./exports/index";

export async function runBenchmarks(): Promise<Measurement[]> {
  const results: Measurement[] = [];
  for (const workload of workloads()) {
    const measurements = await benchmark(workload);
    results[results.length] = measurements[0];
    results[results.length] = measurements[1];
    results[results.length] = measurements[2];
  }
  const exports = await runExportBenchmarks();
  const measurements = results.concat(exports);
  return measurements;
}

async function benchmark(workload: Workload): Promise<Measurement[]> {
  const book = workbookFor(workload);
  const calculate = await measure(workload.name, "calculate", () => book.calculate());
  const edit = await benchmarkEdit(workload, book);
  const exportResult = await measure(workload.name, "export-including-calculation", () =>
    book.toUint8Array(),
  );
  const results = [calculate, edit, exportResult];
  return results;
}

async function benchmarkEdit(workload: Workload, book: Xldx): Promise<Measurement> {
  let input = 1;
  const measurement = await measure(
    workload.name,
    "edit-and-calculate",
    () => {
      input = input === 1 ? 2 : 1;
      book.getSheetData(0).updateCellData("A1", input);
      const calculation = book.calculate();
      return calculation;
    },
    (result) => validateEdit(workload, result.workbook.sheets[0].data, input),
  );
  return measurement;
}

function validateEdit(workload: Workload, data: unknown[][], input: number): void {
  const doubled = workload.column === 1;
  const row = doubled ? 0 : workload.row;
  const expected = doubled ? input * 2 : workload.expected + input - 1;
  const cell = data[row][workload.column];
  const object = typeof cell === "object" && cell !== null;
  const valid = object && "result" in cell && cell.result === expected;
  if (!valid) throw new Error(`Stale edited fixture: ${workload.name}`);
}
