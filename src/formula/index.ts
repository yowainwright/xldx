import type { FormulaArgument, FormulaValue } from "./types.js";
import { argumentText, parseAddress } from "./utils.js";

export type {
  FormulaError,
  FormulaResult,
  FormulaValue,
  FormulaIssue,
  Calculation,
} from "./types.js";

export class Formula {
  readonly formula: string;

  private constructor(formula: string) {
    this.formula = formula;
    Object.freeze(this);
  }

  static parse(input: string): Formula {
    const formula = input.trim().replace(/^=/, "").trim();
    if (!formula) throw new TypeError("Formula must not be empty");
    const value = new Formula(formula);
    return value;
  }

  static ref(address: string): Formula {
    parseAddress(address);
    const value = new Formula(address.toUpperCase());
    return value;
  }

  static range(start: string, end: string): Formula {
    const first = parseAddress(start);
    const last = parseAddress(end);
    const reversed = first.row > last.row || first.column > last.column;
    if (reversed) throw new RangeError("Range must run from top left to bottom right");
    const value = new Formula(`${start.toUpperCase()}:${end.toUpperCase()}`);
    return value;
  }

  static sum(...args: FormulaArgument[]): Formula {
    if (args.length === 0) throw new TypeError("SUM requires an argument");
    const text = args.map(argumentText).join(",");
    const value = new Formula(`SUM(${text})`);
    return value;
  }

  private static binary(left: FormulaArgument, operator: string, right: FormulaArgument): Formula {
    const first = argumentText(left);
    const second = argumentText(right);
    const value = new Formula(`(${first})${operator}(${second})`);
    return value;
  }

  static add(left: FormulaArgument, right: FormulaArgument): Formula {
    const value = Formula.binary(left, "+", right);
    return value;
  }

  static subtract(left: FormulaArgument, right: FormulaArgument): Formula {
    const value = Formula.binary(left, "-", right);
    return value;
  }

  static multiply(left: FormulaArgument, right: FormulaArgument): Formula {
    const value = Formula.binary(left, "*", right);
    return value;
  }

  static divide(left: FormulaArgument, right: FormulaArgument): Formula {
    const value = Formula.binary(left, "/", right);
    return value;
  }

  toJSON(): FormulaValue {
    const { formula } = this;
    const value = { formula };
    return value;
  }
}
