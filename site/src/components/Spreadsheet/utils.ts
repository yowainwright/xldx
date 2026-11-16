import { Data, Effect } from "effect";
import { Formula, Xldx, type SpillRange } from "xldx";
import { COLUMN_COUNT, GLYPHS, ROW_COUNT } from "./constants";

export class CellEditError extends Data.TaggedError("CellEditError")<{
  message: string;
}> {}

export function createSpreadsheet(): Xldx {
  const data = Array.from({ length: ROW_COUNT }, () =>
    Array.from({ length: COLUMN_COUNT }, () => null),
  );
  const sheets = [{ name: "Sheet 1", data }];
  const book = Xldx.fromJSON({ sheets });
  const bitmap = createGrid("1")
    .flat()
    .map((pixel) => pixel ?? "0")
    .join("");
  const formula = Formula.parse(`MID("${bitmap}",SEQUENCE(${ROW_COUNT},${COLUMN_COUNT}),1)`);
  book.getSheetData(0).updateCellData("A1", formula);
  return book;
}

export function spillAt(spills: SpillRange[], row: number, column: number) {
  return spills.find((range) => {
    const withinRows = row >= range.row && row < range.row + range.rows;
    const withinColumns = column >= range.column && column < range.column + range.columns;
    return withinRows && withinColumns;
  });
}

function parseInput(input: string): unknown {
  if (input === "") return null;
  if (input.startsWith("'")) return input.slice(1);
  if (input.trimStart().startsWith("=")) return Formula.parse(input);
  if (input === "TRUE" || input === "FALSE") return input === "TRUE";
  const numeric = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(input);
  if (numeric && Number.isFinite(Number(input))) return Number(input);
  return input;
}

export function commitCell(book: Xldx, address: string, input: string) {
  return Effect.try({
    try: () => {
      const next = Xldx.fromJSON(book.toJSON());
      next.getSheetData(0).updateCellData(address, parseInput(input));
      return next;
    },
    catch: (cause) =>
      new CellEditError({
        message: cause instanceof Error ? cause.message : "Unable to edit cell",
      }),
  });
}

export function readInput(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "formula" in value) return `=${value.formula}`;
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "string") {
    const formulaLike = value.startsWith("'") || value.trimStart().startsWith("=");
    if (formulaLike) return "'" + value;
    const ambiguous = typeof parseInput(value) !== "string";
    if (ambiguous) return "'" + value;
  }
  return String(value);
}

export function readDisplay(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "formula" in value) {
    if (!("result" in value)) return "#ERROR!";
    return readDisplay(value.result);
  }
  if (typeof value === "object" && "error" in value) return String(value.error);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
}

export function isLetterCell(row: number, column: number) {
  const glyphRow = Math.floor((row - 2) / 2);
  const offset = column - 2;
  const letter = Math.floor(offset / 12);
  const glyphColumn = Math.floor((offset % 12) / 2);
  const pixel = GLYPHS[letter]?.[glyphRow]?.[glyphColumn];
  return pixel === "1";
}

export function createGrid(color: string) {
  return Array.from({ length: ROW_COUNT }, (_, row) =>
    Array.from({ length: COLUMN_COUNT }, (_, column) => {
      const filled = isLetterCell(row, column);
      if (filled) return color;
      return undefined;
    }),
  );
}

export function columnLabel(index: number): string {
  const letter = String.fromCharCode(65 + (index % 26));
  if (index < 26) return letter;
  const prefix = columnLabel(Math.floor(index / 26) - 1);
  return prefix + letter;
}
