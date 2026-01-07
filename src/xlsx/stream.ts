import type { CellValue } from "./types";
import {
  COLUMN_CACHE,
  XML_DECLARATION,
  SPREADSHEET_NAMESPACE,
} from "./constants";
import { escapeXml, getCellResult } from "./utils";

const encoder = new TextEncoder();

export function encodeChunk(str: string): Uint8Array {
  return encoder.encode(str);
}

export function* streamWorksheetStart(): Generator<Uint8Array> {
  yield encodeChunk(
    `${XML_DECLARATION}<worksheet xmlns="${SPREADSHEET_NAMESPACE}"><sheetData>`,
  );
}

export function* streamWorksheetEnd(): Generator<Uint8Array> {
  yield encodeChunk("</sheetData></worksheet>");
}

export function streamRow(
  row: readonly CellValue[],
  rowIndex: number,
  addSharedString: (str: string) => number,
): Uint8Array | null {
  const rowNum = rowIndex + 1;
  let cellXml = "";

  for (let colIndex = 0; colIndex < row.length; colIndex++) {
    const cell = row[colIndex];
    const result = getCellResult(cell);

    const hasValue = result.value !== "";
    if (!hasValue) continue;

    const isString = result.type === "s";
    const value = isString
      ? String(addSharedString(result.value))
      : result.value;
    const cellRef = COLUMN_CACHE[colIndex] + rowNum;
    const type = isString ? "s" : result.type;

    cellXml += type
      ? `<c r="${cellRef}" t="${type}"><v>${value}</v></c>`
      : `<c r="${cellRef}"><v>${value}</v></c>`;
  }

  const isEmpty = cellXml === "";
  if (isEmpty) return null;

  return encodeChunk(`<row r="${rowNum}">${cellXml}</row>`);
}

export async function* streamWorksheet(
  rows: AsyncIterable<readonly CellValue[]> | Iterable<readonly CellValue[]>,
  addSharedString: (str: string) => number,
): AsyncGenerator<Uint8Array> {
  yield* streamWorksheetStart();

  let rowIndex = 0;
  for await (const row of rows) {
    const chunk = streamRow(row, rowIndex, addSharedString);
    if (chunk) yield chunk;
    rowIndex++;
  }

  yield* streamWorksheetEnd();
}

export function generateSharedStringsChunk(
  strings: readonly string[],
): Uint8Array {
  const count = strings.length;
  const parts = [
    XML_DECLARATION,
    `<sst xmlns="${SPREADSHEET_NAMESPACE}" count="${count}" uniqueCount="${count}">`,
  ];

  for (const str of strings) {
    parts.push(`<si><t>${escapeXml(str)}</t></si>`);
  }

  parts.push("</sst>");
  return encodeChunk(parts.join(""));
}

export class StreamingXlsxWriter {
  private sharedStrings: string[] = [];
  private stringMap: Map<string, number> = new Map();

  addSharedString = (str: string): number => {
    const existing = this.stringMap.get(str);
    if (existing !== undefined) return existing;

    const index = this.sharedStrings.length;
    this.sharedStrings.push(str);
    this.stringMap.set(str, index);
    return index;
  };

  async *streamWorksheet(
    rows: AsyncIterable<readonly CellValue[]> | Iterable<readonly CellValue[]>,
  ): AsyncGenerator<Uint8Array> {
    yield* streamWorksheet(rows, this.addSharedString);
  }

  getSharedStrings(): readonly string[] {
    return this.sharedStrings;
  }

  generateSharedStringsXml(): Uint8Array {
    return generateSharedStringsChunk(this.sharedStrings);
  }
}
