import type { Worksheet } from "../types";
import type { ParallelResult } from "./types";
import {
  createTask,
  processTask,
  mergeSharedStrings,
  remapStringReferences,
} from "./utils";

export type {
  WorkerTask,
  WorkerResult,
  MergedStrings,
  ParallelResult,
} from "./types";
export * from "./constants";
export * from "./utils";

export function generateWorksheetsParallel(
  worksheets: readonly Worksheet[],
): ParallelResult {
  const tasks = worksheets.map((sheet, i) => createTask(sheet, i));
  const results = tasks.map(processTask);
  const { mergedStrings, remappings } = mergeSharedStrings(results);

  const worksheetXmls = results
    .sort((a, b) => a.sheetIndex - b.sheetIndex)
    .map((result) => {
      const remapping = remappings.get(result.sheetIndex)!;
      return remapStringReferences(result.xml, remapping);
    });

  return { worksheetXmls, sharedStrings: mergedStrings };
}
