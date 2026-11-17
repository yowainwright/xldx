import { Formula, Xldx } from "../../src/index";
import type { Measurement, Workload } from "./types";

export function workloads(): Workload[] {
  const independent = [100, 1000, 10000].map(independentWorkload);
  const chain = chainWorkload();
  const fanout = fanoutWorkload();
  const range = rangeWorkload();
  const all = [...independent, chain, fanout, range];
  return all;
}

export async function measure<T>(
  workload: string,
  operation: string,
  run: () => T | Promise<T>,
  validate?: (result: T) => void,
): Promise<Measurement> {
  for (let warmup = 0; warmup < 5; warmup++) await run();
  const times: number[] = [];
  for (let sample = 0; sample < 30; sample++) {
    const start = performance.now();
    const result = await run();
    times[sample] = performance.now() - start;
    validate?.(result);
  }
  const sorted = times.toSorted((left, right) => left - right);
  const medianMs = (sorted[14] + sorted[15]) / 2;
  const p95Ms = sorted.at(Math.ceil(sorted.length * 0.95) - 1) ?? 0;
  const result = { workload, operation, medianMs, p95Ms };
  return result;
}

export function workbookFor(workload: Workload): Xldx {
  const { data } = workload;
  const sheets = [{ name: "Data", data }];
  const book = Xldx.fromJSON({ sheets });
  const actual = book.calculate().workbook.sheets[0].data[workload.row][workload.column];
  const object = typeof actual === "object" && actual !== null;
  const valid = object && "result" in actual && actual.result === workload.expected;
  if (!valid) throw new Error(`Incorrect benchmark fixture: ${workload.name}`);
  return book;
}

function independentWorkload(count: number): Workload {
  const data = Array.from({ length: count }, (_, index) => {
    const reference = `A${index + 1}`;
    const doubled = Formula.multiply(Formula.ref(reference), 2);
    const row = [index, doubled];
    return row;
  });
  const name = `independent-${count}`;
  const row = count - 1;
  const expected = row * 2;
  const workload = { name, data, row, column: 1, expected };
  return workload;
}

function chainWorkload(): Workload {
  const data: unknown[][] = [[1]];
  for (let row = 1; row <= 100; row++) {
    const formula = Formula.parse(`A${row}+1`);
    data[row] = [formula];
  }
  const workload = { name: "chain-100", data, row: 100, column: 0, expected: 101 };
  return workload;
}

function fanoutWorkload(): Workload {
  const formula = Formula.parse("$A$1*2");
  const data = Array.from({ length: 1000 }, () => [1, formula]);
  const workload = { name: "fanout-1000", data, row: 999, column: 1, expected: 2 };
  return workload;
}

function rangeWorkload(): Workload {
  const data: unknown[][] = Array.from({ length: 100 }, () => Array.from({ length: 100 }, () => 1));
  data[100] = [Formula.sum(Formula.range("A1", "CV100"))];
  const workload = { name: "range-100x100", data, row: 100, column: 0, expected: 10000 };
  return workload;
}
