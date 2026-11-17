import { ERRORS } from "./constants.js";
import type {
  Address,
  FormulaArgument,
  FormulaError,
  FormulaResult,
  FormulaValue,
} from "./types.js";

export function argumentText(value: FormulaArgument): string {
  if (typeof value === "string") {
    const escaped = value.replace(/"/g, '""');
    const literal = `"${escaped}"`;
    return literal;
  }
  if (typeof value === "boolean") {
    const literal = value ? "TRUE" : "FALSE";
    return literal;
  }
  const literal = numericArgument(value);
  if (literal !== undefined) return literal;
  const formula = normalizeFormula(value);
  if (formula) {
    const { formula: text } = formula;
    return text;
  }
  throw new TypeError("Invalid formula argument");
}

export function normalizeFormula(value: unknown): FormulaValue | undefined {
  const object = typeof value === "object" && value !== null;
  if (!object) return undefined;
  if (!Object.hasOwn(value, "formula")) return undefined;
  if (!("formula" in value)) return undefined;
  const { formula } = value;
  const nonemptyText = typeof formula === "string" && formula.trim() !== "";
  if (!nonemptyText) throw new TypeError("Invalid formula text");
  const storedText = !formula.trimStart().startsWith("=");
  const validKeys = Object.keys(value).every((key) => key === "formula" || key === "result");
  const validValue = storedText && validKeys;
  if (!validValue) throw new TypeError("Invalid formula value");
  if (!("result" in value)) {
    const normalized = { formula };
    return normalized;
  }
  const result = normalizeResult(value.result);
  const normalized = { formula, result };
  return normalized;
}

export function normalizeResult(value: unknown): FormulaResult {
  const scalar = typeof value === "string" || typeof value === "boolean";
  if (scalar) return value;
  const finiteNumber = typeof value === "number" && Number.isFinite(value);
  if (finiteNumber) return value;
  const object = typeof value === "object" && value !== null;
  if (!object) throw new TypeError("Invalid formula result");
  if (!("error" in value)) throw new TypeError("Invalid formula result");
  if (!isFormulaError(value.error)) throw new TypeError("Invalid formula error");
  if (Object.keys(value).length !== 1) throw new TypeError("Invalid formula result");
  const { error } = value;
  const result = Object.freeze({ error });
  return result;
}

export function isFormulaError(value: unknown): value is FormulaError {
  const valid = ERRORS.some((error) => error === value);
  return valid;
}

export function parseAddress(input: string): Address {
  const match = /^\$?([A-Z]{1,3})\$?([1-9]\d*)$/i.exec(input);
  if (!match) throw new RangeError(`Invalid cell address: ${input}`);
  const column =
    Array.from(match[1].toUpperCase()).reduce(
      (value, letter) => value * 26 + letter.charCodeAt(0) - 64,
      0,
    ) - 1;
  const row = Number(match[2]) - 1;
  const outside = column >= 16384 || row >= 1048576;
  if (outside) throw new RangeError(`Invalid cell address: ${input}`);
  const address = { row, column };
  return address;
}

export function cellAddress(row: number, column: number): string {
  const letter = String.fromCharCode(65 + (column % 26));
  if (column < 26) {
    const address = `${letter}${row + 1}`;
    return address;
  }
  const prefix = cellAddress(0, Math.floor(column / 26) - 1).slice(0, -1);
  const address = `${prefix}${letter}${row + 1}`;
  return address;
}
export function excelFormula(source: string, encode: boolean): string {
  const tokens = /"(?:""|[^"])*"|[\p{L}\p{N}\p{M}_.$\\]+\s*\(/giu;
  const formula = source.replace(tokens, (token) => {
    const sequence = /^(?:_xlfn\.)?SEQUENCE\s*\($/i.test(token);
    if (!sequence) return token;
    const name = encode ? "_xlfn.SEQUENCE(" : "SEQUENCE(";
    return name;
  });
  return formula;
}

function numericArgument(value: FormulaArgument): string | undefined {
  const finiteNumber = typeof value === "number" && Number.isFinite(value);
  if (!finiteNumber) return undefined;
  const literal = String(value);
  return literal;
}
