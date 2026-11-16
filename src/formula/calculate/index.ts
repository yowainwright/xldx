import type { Workbook } from "../../types.js";
import { readCellValue } from "../../utils.js";
import type { Worksheet } from "../../xlsx/types.js";
import type { Address, Calculation, FormulaIssue, FormulaValue, SpillRange } from "../types.js";
import { MAX_VISITS } from "../constants.js";
import { cellAddress, normalizeFormula, normalizeResult } from "../utils.js";
import { FormulaParser } from "../parser/index.js";
import { checkDepth, FormulaFault } from "../parser/utils.js";
import type { Expression, Operator, Scalar, Value, ValueExpression } from "../parser/types.js";
import { applyValues, arrayExpression, mid, scalarValue, sequence } from "../array/index.js";
import { SpillGrid } from "../spill/index.js";
import type { ArrayAnchor, Outcome } from "./types.js";
import { arithmetic, finite, numeric } from "./utils.js";

class SheetCalculator {
  private readonly memo = new Map<number, Outcome>();
  private readonly active = new Set<number>();
  private visits = 0;
  private readonly reported = new Set<string>();
  readonly issues: FormulaIssue[] = [];
  private readonly spill: SpillGrid;
  private readonly arrays: ArrayAnchor[] = [];
  private readonly dependencies = new Map<number, Set<number>>();
  private readonly probes = new Map<string, SpillRange>();

  constructor(
    private readonly sheet: Worksheet,
    private readonly parsed: Map<string, Expression>,
  ) {
    this.spill = new SpillGrid(sheet.data);
  }

  calculate(): Worksheet {
    this.prepareArrays();
    const data = this.sheet.data.map((row, rowIndex) => this.calculateRow(row, rowIndex));
    this.spill.apply(data);
    const worksheet: Worksheet = { ...this.sheet, data };
    if (this.spill.ranges.length) worksheet.spills = this.spill.ranges;
    return worksheet;
  }

  private prepareArrays(): void {
    this.sheet.data.forEach((cells, row) => this.prepareRow(cells, row));
    this.arrays.forEach(({ cell, address }) => this.output(cell, address.row, address.column));
  }

  private prepareRow(cells: unknown[], row: number): void {
    cells.forEach((value, column) => {
      const formula = normalizeFormula(value);
      if (!formula) return;
      try {
        const expression = this.parse(formula.formula);
        if (!arrayExpression(expression)) return;
        const address = { row, column };
        this.arrays[this.arrays.length] = { cell: formula, address };
      } catch (failure) {
        if (!(failure instanceof FormulaFault)) throw failure;
      }
    });
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
      const address = { row, column };
      const result = this.readCell(address, 0) ?? 0;
      this.recordResultError(result, address);
      this.recordSpillErrors(address);
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
      const scalar = this.readScalar(address, value, depth);
      return scalar;
    }
    const scalar = this.formulaCell(formula.formula, address, key, depth);
    return scalar;
  }

  private readScalar(address: Address, value: unknown, depth: number): Scalar {
    const present = value !== null && value !== undefined;
    if (present) {
      const scalar = this.scalar(value);
      return scalar;
    }
    this.resolveSpill(address, depth);
    const spilled = this.spill.read(address);
    if (spilled !== undefined) return spilled;
    const key = address.row * 16384 + address.column;
    this.trackRead(key);
    return null;
  }

  private resolveSpill(address: Address, depth: number): void {
    if (this.spill.read(address) !== undefined) return;
    const candidates = this.arrays.filter((anchor) => {
      const key = anchor.address.row * 16384 + anchor.address.column;
      const earlier = anchor.address.row <= address.row && anchor.address.column <= address.column;
      const pending = earlier && !this.active.has(key) && !this.memo.has(key);
      return pending;
    });
    for (const anchor of candidates) {
      this.resolveCandidate(anchor, address, depth);
      if (this.spill.read(address) !== undefined) return;
    }
  }

  private resolveCandidate(anchor: ArrayAnchor, address: Address, depth: number): void {
    const probe = this.probeKey(anchor);
    const known = this.probes.get(probe);
    const outside = known && this.outsideProbe(known, address);
    if (outside) return;
    const previous = new Set(this.memo.keys());
    const parents = this.suspendReads();
    try {
      this.readCell(anchor.address, depth + 1);
    } catch (failure) {
      if (!(failure instanceof FormulaFault)) throw failure;
    } finally {
      this.finishProbe(anchor, address, previous, parents);
    }
  }

  private probeKey(anchor: ArrayAnchor): string {
    const key = anchor.address.row * 16384 + anchor.address.column;
    const context = [key, ...this.active, this.spill.ranges.length];
    const probe = context.join(":");
    return probe;
  }

  private outsideProbe(range: SpillRange, address: Address): boolean {
    const rows = address.row >= range.row && address.row < range.row + range.rows;
    const columns = address.column >= range.column && address.column < range.column + range.columns;
    const outside = !rows || !columns;
    return outside;
  }

  private finishProbe(
    anchor: ArrayAnchor,
    address: Address,
    previous: Set<number>,
    parents: Map<number, Set<number> | undefined>,
  ): void {
    const resolved = this.spill.read(address) !== undefined;
    const key = anchor.address.row * 16384 + anchor.address.column;
    const reads = resolved ? this.dependencies.get(key) : undefined;
    this.restoreReads(parents, reads);
    if (resolved) return;
    const range = this.spill.ranges.find(
      (range) => range.row === anchor.address.row && range.column === anchor.address.column,
    );
    this.discardSpeculation(previous);
    if (!range) return;
    const probe = this.probeKey(anchor);
    this.probes.set(probe, range);
  }

  private restoreReads(parents: Map<number, Set<number> | undefined>, reads?: Set<number>): void {
    parents.forEach((saved, parent) => {
      const combined = new Set([...(saved ?? []), ...(reads ?? [])]);
      this.dependencies.set(parent, combined);
    });
  }

  private suspendReads(): Map<number, Set<number> | undefined> {
    const saved = new Map<number, Set<number> | undefined>();
    this.active.forEach((key) => {
      saved.set(key, this.dependencies.get(key));
      this.dependencies.delete(key);
    });
    return saved;
  }

  private discardSpeculation(previous: Set<number>): void {
    this.memo.forEach((outcome, key) => {
      const reads = this.dependencies.get(key);
      const independent = "value" in outcome && !reads?.size;
      const retained = previous.has(key) || independent;
      if (retained) return;
      const row = Math.floor(key / 16384);
      const column = key % 16384;
      this.spill.remove({ row, column });
      this.memo.delete(key);
      this.dependencies.delete(key);
    });
  }

  private trackRead(key: number): void {
    this.active.forEach((anchor) => {
      const reads = this.dependencies.get(anchor) ?? new Set<number>();
      reads.add(key);
      this.dependencies.set(anchor, reads);
    });
  }

  private formulaCell(source: string, address: Address, key: number, depth: number): Scalar {
    this.active.add(key);
    try {
      const expression = this.parse(source);
      const evaluated = this.evaluate(expression, depth + 1);
      const value = this.spillResult(evaluated, address);
      this.memo.set(key, { value });
      return value;
    } catch (failure) {
      if (!(failure instanceof FormulaFault)) throw failure;
      this.memo.set(key, { failure });
      throw failure;
    } finally {
      this.active.delete(key);
    }
  }

  private spillResult(value: Value, address: Address): Scalar {
    if (!Array.isArray(value)) return value;
    this.visit(value.length * value[0].length);
    const key = address.row * 16384 + address.column;
    this.spill.add(address, value, this.dependencies.get(key));
    const first = value[0][0];
    return first;
  }

  private record(failure: FormulaFault, address: Address): void {
    const cell = cellAddress(address.row, address.column);
    if (this.reported.has(cell)) return;
    this.reported.add(cell);
    const { name: sheet } = this.sheet;
    const { code, message } = failure;
    this.issues[this.issues.length] = { sheet, cell, code, message };
  }

  private recordSpillErrors(address: Address): void {
    const range = this.spill.ranges.find(
      (range) => range.row === address.row && range.column === address.column,
    );
    if (!range) return;
    const size = range.rows * range.columns;
    for (let index = 0; index < size; index++) {
      const row = range.row + Math.floor(index / range.columns);
      const column = range.column + (index % range.columns);
      const value = this.spill.read({ row, column });
      if (this.recordResultError(value, address)) return;
    }
  }

  private recordResultError(value: Scalar | undefined, address: Address): boolean {
    const error = value !== null && typeof value === "object";
    if (!error) return false;
    const code = value.error === "#DIV/0!" ? "divide-by-zero" : "value";
    const failure = new FormulaFault(code, value.error, value.error);
    this.record(failure, address);
    return true;
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

  private scalar(cell: unknown): Scalar {
    const value = readCellValue(cell);
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

  private evaluate(node: Expression, depth: number): Value {
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

  private readValue(node: ValueExpression, depth: number): Value {
    if (node.kind === "literal") {
      const { value } = node;
      return value;
    }
    if (node.kind === "reference") {
      const value = this.readCell(node.address, depth);
      return value;
    }
    if (node.kind === "range") throw new FormulaFault("value", "Range requires SUM", "#VALUE!");
    if (node.kind === "call") {
      const args = node.args.map((arg) => this.evaluate(arg, depth + 1));
      const value = node.name === "SEQUENCE" ? sequence(args) : mid(args);
      return value;
    }
    const value = this.sum(node.args, depth + 1);
    return value;
  }

  private unary(operator: string, node: Expression, depth: number): Value {
    const value = this.evaluate(node, depth + 1);
    const result = applyValues([value], ([scalar]) => {
      const number = numeric(scalar);
      const signed = operator === "+" ? number : -number;
      return signed;
    });
    return result;
  }

  private binary(operator: Operator, first: Expression, second: Expression, depth: number): Value {
    const left = this.evaluate(first, depth + 1);
    const right = this.evaluate(second, depth + 1);
    const value = applyValues([left, right], ([first, second]) => {
      const left = numeric(first);
      const right = numeric(second);
      const result = arithmetic(left, operator, right);
      return result;
    });
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
      if (Array.isArray(value)) {
        total = this.arraySum(value, total);
        continue;
      }
      const scalar = scalarValue(value);
      const ignored = argument.kind === "reference" && typeof scalar !== "number";
      if (!ignored) total = finite(total + numeric(scalar));
    }
    return total;
  }

  private arraySum(value: Scalar[][], initial: number): number {
    const scalars = value.flat().map(scalarValue);
    const numbers = scalars.filter((item) => typeof item === "number");
    const sum = numbers.reduce((sum, number) => finite(sum + number), initial);
    return sum;
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
      const scalar = scalarValue(value);
      if (typeof scalar === "number") total = finite(total + scalar);
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
