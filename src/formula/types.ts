import type { Workbook } from "../types.js";

export type FormulaError =
  | "#NULL!"
  | "#DIV/0!"
  | "#VALUE!"
  | "#REF!"
  | "#NAME?"
  | "#NUM!"
  | "#N/A"
  | "#SPILL!"
  | "#CALC!";
export type FormulaResult = number | string | boolean | Readonly<{ error: FormulaError }>;
export type FormulaValue = Readonly<{ formula: string; result?: FormulaResult }>;
export type FormulaArgument = FormulaValue | number | string | boolean;
export type IssueCode =
  | "syntax"
  | "unsupported"
  | "reference"
  | "value"
  | "divide-by-zero"
  | "cycle"
  | "limit"
  | "number"
  | "spill";
export type SpillRange = { row: number; column: number; rows: number; columns: number };
export type FormulaIssue = { sheet: string; cell: string; code: IssueCode; message: string };
export type Calculation = { workbook: Workbook; issues: FormulaIssue[] };
export type Address = { row: number; column: number };
