import type { Worksheet } from "../types";
import type { WorkerTask, WorkerResult, MergedStrings } from "./types";
import { generateWorksheet } from "../index";
import { SHARED_STRING_CELL_REGEX, sharedStringCell } from "./constants";

export function createTask(sheet: Worksheet, sheetIndex: number): WorkerTask {
  return { sheet, sheetIndex };
}

export function processTask(task: WorkerTask): WorkerResult {
  const sharedStrings: string[] = [];
  const stringMap = new Map<string, number>();

  const addSharedString = (str: string): number => {
    const existing = stringMap.get(str);
    if (existing !== undefined) return existing;

    const index = sharedStrings.length;
    sharedStrings.push(str);
    stringMap.set(str, index);
    return index;
  };

  const xml = generateWorksheet(task.sheet, addSharedString);
  return { xml, sheetIndex: task.sheetIndex, sharedStrings };
}

export function mergeSharedStrings(
  results: readonly WorkerResult[],
): MergedStrings {
  const mergedStrings: string[] = [];
  const globalMap = new Map<string, number>();
  const remappings = new Map<number, Map<number, number>>();

  for (const result of results) {
    const localToGlobal = new Map<number, number>();

    result.sharedStrings.forEach((str, localIndex) => {
      let globalIndex = globalMap.get(str);
      if (globalIndex === undefined) {
        globalIndex = mergedStrings.length;
        mergedStrings.push(str);
        globalMap.set(str, globalIndex);
      }
      localToGlobal.set(localIndex, globalIndex);
    });

    remappings.set(result.sheetIndex, localToGlobal);
  }

  return { mergedStrings, remappings };
}

export function remapStringReferences(
  xml: string,
  remapping: ReadonlyMap<number, number>,
): string {
  return xml.replace(SHARED_STRING_CELL_REGEX, (match, ref, index) => {
    const localIndex = parseInt(index);
    const globalIndex = remapping.get(localIndex);
    return globalIndex !== undefined
      ? sharedStringCell(ref, globalIndex)
      : match;
  });
}
