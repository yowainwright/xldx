import type { FormulaError } from "./types.js";

export const ERRORS: readonly FormulaError[] = [
  "#NULL!",
  "#DIV/0!",
  "#VALUE!",
  "#REF!",
  "#NAME?",
  "#NUM!",
  "#N/A",
];
export const NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/;
export const MAX_LENGTH = 8192;
export const MAX_DEPTH = 128;
export const MAX_VISITS = 100000;
