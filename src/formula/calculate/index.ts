import type { Workbook } from "../../types.js";
import type { Worksheet } from "../../xlsx/types.js";
import type { Address, Calculation, FormulaIssue, FormulaValue } from "../types.js";
import { MAX_VISITS } from "../constants.js";
import { cellAddress, normalizeFormula, normalizeResult } from "../utils.js";
import { FormulaParser } from "../parser/index.js";
import { checkDepth, FormulaFault } from "../parser/utils.js";
import type { Expression, Operator, Scalar, ValueExpression } from "../parser/types.js";
import type { Outcome } from "./types.js";
import { arithmetic, finite, numeric } from "./utils.js";

class SheetCalculator {
  private readonly memo = new Map<number, Outcome>();
  private readonly active = new Set<number>();
  private visits = 0;
  private readonly reported = new Set<string>();
  readonly issues: FormulaIssue[] = [];

  constructor(
    private readonly sheet: Worksheet,
    private readonly parsed: Map<string, Expression>,
  ) {}

  calculate(): Worksheet {
    const data = this.sheet.data.map((row, rowIndex) => this.calculateRow(row, rowIndex));
    const worksheet = { ...this.sheet, data };
    return worksheet;
  }

  private calculateRow(row: unknown[], rowIndex: number): unknown[] {
    const cells = row.map((value, column) => {
      const formula = normalizeFormula(value);
      if (!formula) return value;
      const cell = this.output(formula, rowIndex, column);
      return cell;
    });
    return cells;
  }

  private output(cell: FormulaValue, row: number, column: number): FormulaValue {
    const { formula } = cell;
    try {
      const result = this.readCell({ row, column }, 0) ?? 0;
      const value = { formula, result };
      return value;
    } catch (failure) {
      if (!(failure instanceof FormulaFault)) throw failure;
      this.record(failure, { row, column });
      const value = this.failedValue(formula, failure);
      return value;
    }
  }

  private failedValue(formula: string, failure: FormulaFault): FormulaValue {
    if (!failure.error) {
      const value = { formula };
      return value;
    }
    const { error } = failure;
    const result = { error };
    const value = { formula, result };
    return value;
  }

  private readCell(address: Address, depth: number): Scalar {
    checkDepth(depth);
    this.visit();
    const key = address.row * 16384 + address.column;
    if (this.active.has(key)) throw new FormulaFault("cycle", "Circular reference", "#REF!");
    const memo = this.memo.get(key);
    if (memo) {
      if ("failure" in memo) throw memo.failure;
      const { value } = memo;
      return value;
    }
    const value = this.sheet.data[address.row]?.[address.column];
    const formula = normalizeFormula(value);
    if (!formula) {
      const scalar = this.scalar(value);
      return scalar;
    }
    const scalar = this.formulaCell(formula.formula, address, key, depth);
    return scalar;
  }

  private formulaCell(source: string, address: Address, key: number, depth: number): Scalar {
    this.active.add(key);
    try {
      const expression = this.parse(source);
      const value = this.evaluate(expression, depth + 1);
      this.memo.set(key, { value });
      return value;
    } catch (failure) {
      if (!(failure instanceof FormulaFault)) throw failure;
      this.memo.set(key, { failure });
      this.record(failure, address);
      throw failure;
    } finally {
      this.active.delete(key);
    }
  }

  private record(failure: FormulaFault, address: Address): void {
    const cell = cellAddress(address.row, address.column);
    if (this.reported.has(cell)) return;
    this.reported.add(cell);
    const { name: sheet } = this.sheet;
    const { code, message } = failure;
    this.issues[this.issues.length] = { sheet, cell, code, message };
  }

  private visit(count = 1): void {
    this.visits += count;
    if (this.visits > MAX_VISITS) throw new FormulaFault("limit", "Cell visit limit exceeded");
  }

  private parse(source: string): Expression {
    const cached = this.parsed.get(source);
    if (cached) return cached;
    const expression = new FormulaParser(source).parse();
    this.parsed.set(source, expression);
    return expression;
  }

  private scalar(value: unknown): Scalar {
    const blank = value === null || value === undefined;
    if (blank) return null;
    const primitive = typeof value === "string" || typeof value === "boolean";
    if (primitive) return value;
    if (typeof value === "number") {
      const result = finite(value);
      return result;
    }
    const errorObject = typeof value === "object" && "error" in value;
    if (errorObject) this.throwCellError(value);
    throw new FormulaFault("value", "Unsupported cell value", "#VALUE!");
  }

  private throwCellError(value: unknown): void {
    const result = normalizeResult(value);
    if (typeof result !== "object") return;
    throw new FormulaFault("value", result.error, result.error);
  }

  private evaluate(node: Expression, depth: number): Scalar {
    checkDepth(depth);
    if (node.kind === "unary") {
      const value = this.unary(node.operator, node.value, depth);
      return value;
    }
    if (node.kind === "binary") {
      const value = this.binary(node.operator, node.left, node.right, depth);
      return value;
    }
    const value = this.readValue(node, depth);
    return value;
  }

  private readValue(node: ValueExpression, depth: number): Scalar {
    if (node.kind === "literal") {
      const { value } = node;
      return value;
    }
    if (node.kind === "reference") {
      const value = this.readCell(node.address, depth);
      return value;
    }
    if (node.kind === "range") throw new FormulaFault("value", "Range requires SUM", "#VALUE!");
    const value = this.sum(node.args, depth + 1);
    return value;
  }

  private unary(operator: string, node: Expression, depth: number): number {
    const value = numeric(this.evaluate(node, depth + 1));
    const signed = operator === "+" ? value : -value;
    return signed;
  }

  private binary(operator: Operator, first: Expression, second: Expression, depth: number): number {
    const left = numeric(this.evaluate(first, depth + 1));
    const right = numeric(this.evaluate(second, depth + 1));
    const value = arithmetic(left, operator, right);
    return value;
  }

  private sum(args: Expression[], depth: number): number {
    let total = 0;
    for (const argument of args) {
      if (argument.kind === "range") {
        total = finite(total + this.rangeSum(argument.start, argument.end, depth));
        continue;
      }
      const value = this.evaluate(argument, depth);
      const ignored = argument.kind === "reference" && typeof value !== "number";
      if (!ignored) total = finite(total + numeric(value));
    }
    return total;
  }

  private rangeSum(start: Address, end: Address, depth: number): number {
    const area = (end.row - start.row + 1) * (end.column - start.column + 1);
    if (area + this.visits > MAX_VISITS)
      throw new FormulaFault("limit", "Range visit limit exceeded");
    let total = 0;
    const width = end.column - start.column + 1;
    for (let index = 0; index < area; index++) {
      const row = start.row + Math.floor(index / width);
      const column = start.column + (index % width);
      const value = this.readCell({ row, column }, depth);
      if (typeof value === "number") total = finite(total + value);
    }
    return total;
  }
}

export function calculateWorkbook(workbook: Workbook): Calculation {
  const parsed = new Map<string, Expression>();
  const calculators = workbook.sheets.map((sheet) => new SheetCalculator(sheet, parsed));
  const sheets = calculators.map((calculator) => {
    const result = calculator.calculate();
    return result;
  });
  const issues = calculators.flatMap((calculator) => calculator.issues);
  const calculated = { sheets };
  const result = { workbook: calculated, issues };
  return result;
}
