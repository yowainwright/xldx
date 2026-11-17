import type { FormulaValue, FormulaResult, SpillRange } from "../formula/types.js";

export type CellValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | FormulaValue
  | FormulaResult;

export interface Worksheet {
  name: string;
  data: unknown[][];
  columnWidths?: number[];
  spills?: SpillRange[];
}

export interface EncodedCell {
  type: string;
  value: string;
}
