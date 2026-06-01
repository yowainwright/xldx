import type { Worksheet } from "../types";

export interface WorkerTask {
  readonly sheet: Worksheet;
  readonly sheetIndex: number;
}

export interface WorkerResult {
  readonly xml: string;
  readonly sheetIndex: number;
  readonly sharedStrings: readonly string[];
}

export interface MergedStrings {
  readonly mergedStrings: readonly string[];
  readonly remappings: ReadonlyMap<number, ReadonlyMap<number, number>>;
}

export interface ParallelResult {
  readonly worksheetXmls: readonly string[];
  readonly sharedStrings: readonly string[];
}
