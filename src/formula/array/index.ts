import { MAX_VISITS } from "../constants.js";
import { FormulaFault } from "../parser/utils.js";
import type { Expression, Scalar, Value } from "../parser/types.js";
import { finite, numeric } from "../calculate/utils.js";

export function arrayExpression(node: Expression): boolean {
  if (node.kind === "call") {
    const array = node.name === "SEQUENCE" || node.args.some(arrayExpression);
    return array;
  }
  if (node.kind === "unary") {
    const array = arrayExpression(node.value);
    return array;
  }
  if (node.kind === "binary") {
    const array = arrayExpression(node.left) || arrayExpression(node.right);
    return array;
  }
  return false;
}

export function scalarValue(value: Value): Scalar {
  if (Array.isArray(value)) throw new FormulaFault("value", "Expected a scalar", "#VALUE!");
  const error = value !== null && typeof value === "object";
  if (error) throw new FormulaFault("value", value.error, value.error);
  return value;
}

export function sequence(args: Value[]): Value {
  const invalidCount = args.length < 1 || args.length > 4;
  if (invalidCount) throw new FormulaFault("value", "SEQUENCE expects 1 to 4 arguments", "#VALUE!");
  const numbers = args.map((value) => numeric(scalarValue(value)));
  const [rowsValue, columnsValue = 1, start = 1, step = 1] = numbers;
  const rows = Math.trunc(rowsValue);
  const columns = Math.trunc(columnsValue);
  checkDimensions(rows, columns);
  const result = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => {
      const value = finite(start + (row * columns + column) * step);
      return value;
    }),
  );
  return result;
}

export function mid(args: Value[]): Value {
  if (args.length !== 3) throw new FormulaFault("value", "MID expects 3 arguments", "#VALUE!");
  const result = applyValues(args, substring);
  return result;
}

export function applyValues(values: Value[], apply: (args: Scalar[]) => Scalar): Value {
  const arrays = values.filter(Array.isArray);
  if (arrays.length === 0) {
    const args = values.map(scalarValue);
    const result = apply(args);
    return result;
  }
  const rows = Math.max(...arrays.map((array) => array.length));
  const columns = Math.max(...arrays.map((array) => array[0].length));
  checkDimensions(rows, columns);
  const result = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => {
      const result = applyElement(values, row, column, apply);
      return result;
    }),
  );
  return result;
}

function applyElement(
  values: Value[],
  row: number,
  column: number,
  apply: (args: Scalar[]) => Scalar,
): Scalar {
  try {
    const args = values.map((value) => element(value, row, column));
    const scalars = args.map(scalarValue);
    const result = apply(scalars);
    return result;
  } catch (failure) {
    if (!(failure instanceof FormulaFault)) throw failure;
    const { error } = failure;
    if (!error) throw failure;
    const result = { error };
    return result;
  }
}

function element(value: Value, row: number, column: number): Scalar {
  if (!Array.isArray(value)) return value;
  const rowIndex = value.length === 1 ? 0 : row;
  const columnIndex = value[0].length === 1 ? 0 : column;
  const result = value[rowIndex]?.[columnIndex];
  if (result === undefined) throw new FormulaFault("value", "Array sizes differ", "#N/A");
  return result;
}

function checkDimensions(rows: number, columns: number): void {
  const empty = rows === 0 || columns === 0;
  if (empty) throw new FormulaFault("value", "Empty array", "#CALC!");
  const negative = rows < 0 || columns < 0;
  if (negative) throw new FormulaFault("value", "Array dimensions must be positive", "#VALUE!");
  const outside = rows > 1048576 || columns > 16384;
  const excessive = outside || rows * columns > MAX_VISITS;
  if (excessive) throw new FormulaFault("limit", "Array size limit exceeded");
}

function substring(args: Scalar[]): string {
  const [text, first, count] = args;
  const start = Math.trunc(numeric(first));
  const length = Math.trunc(numeric(count));
  const invalid = start < 1 || length < 0;
  if (invalid) throw new FormulaFault("value", "Invalid MID bounds", "#VALUE!");
  const content = text === null ? "" : String(text);
  const characters = Array.from(content);
  const result = characters.slice(start - 1, start - 1 + length).join("");
  return result;
}
