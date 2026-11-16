import { NUMBER_PATTERN } from "../constants.js";
import { FormulaFault } from "../parser/utils.js";
import type { Operator, Scalar } from "../parser/types.js";

export function numeric(value: Scalar): number {
  if (value === null) return 0;
  if (typeof value === "object") throw new FormulaFault("value", value.error, value.error);
  if (typeof value === "number") return value;
  if (typeof value === "boolean") {
    const number = Number(value);
    return number;
  }
  if (NUMBER_PATTERN.test(value)) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  throw new FormulaFault("value", "Expected a number", "#VALUE!");
}

export function arithmetic(left: number, operator: Operator, right: number): number {
  let result = left + right;
  if (operator === "-") result = left - right;
  if (operator === "*") result = left * right;
  if (operator !== "/") {
    const value = finite(result);
    return value;
  }
  if (right === 0) throw new FormulaFault("divide-by-zero", "Division by zero", "#DIV/0!");
  const value = finite(left / right);
  return value;
}
export function finite(value: number): number {
  if (!Number.isFinite(value)) throw new FormulaFault("number", "Nonfinite result", "#NUM!");
  return value;
}
