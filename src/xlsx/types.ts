import type { FormulaValue, FormulaResult } from "../formula/types.js";

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
}

export interface EncodedCell {
  type: string;
  value: string;
}
