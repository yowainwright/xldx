import { MAX_LENGTH } from "../constants.js";
import type { Expression } from "./types.js";
import { checkDepth, FormulaFault, readAddress } from "./utils.js";

export class FormulaParser {
  private offset = 0;
  private token = "";
  private readonly tokens =
    /\s*("(?:""|[^"])*"|(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z_$][A-Za-z0-9_$]*|[()+*/,:-])/y;

  constructor(private readonly source: string) {}

  parse(): Expression {
    if (this.source.length > MAX_LENGTH)
      throw new FormulaFault("limit", "Formula length limit exceeded");
    this.advance();
    const expression = this.expression(0);
    if (this.token) throw new FormulaFault("syntax", `Unexpected token: ${this.token}`);
    return expression;
  }

  private advance(): void {
    this.tokens.lastIndex = this.offset;
    const match = this.tokens.exec(this.source);
    if (!match) {
      const remaining = this.source.slice(this.offset).trim();
      if (remaining) throw new FormulaFault("unsupported", `Unsupported syntax: ${remaining}`);
      this.token = "";
      return;
    }
    this.offset = this.tokens.lastIndex;
    this.token = match[1];
  }

  private take(token: string): void {
    if (this.token !== token) throw new FormulaFault("syntax", `Expected ${token}`);
    this.advance();
  }

  private expression(depth: number): Expression {
    checkDepth(depth);
    let left = this.product(depth);
    while (this.token === "+" || this.token === "-") {
      const { token: operator } = this;
      this.advance();
      const right = this.product(depth);
      left = { kind: "binary", operator, left, right };
    }
    return left;
  }

  private product(depth: number): Expression {
    let left = this.unary(depth);
    while (this.token === "*" || this.token === "/") {
      const { token: operator } = this;
      this.advance();
      const right = this.unary(depth);
      left = { kind: "binary", operator, left, right };
    }
    return left;
  }

  private unary(depth: number): Expression {
    checkDepth(depth);
    const signed = this.token === "+" || this.token === "-";
    if (signed) {
      const positive = this.token === "+";
      const operator = positive ? "+" : "-";
      this.advance();
      const value = this.unary(depth + 1);
      const expression: Expression = { kind: "unary", operator, value };
      return expression;
    }
    const expression = this.primary(depth);
    return expression;
  }

  private primary(depth: number): Expression {
    const token = this.token;
    if (!token) throw new FormulaFault("syntax", "Expected an expression");
    this.advance();
    if (token === "(") {
      const expression = this.expression(depth + 1);
      this.take(")");
      return expression;
    }
    if (token.startsWith('"')) {
      const value = token.slice(1, -1).replace(/""/g, '"');
      const expression: Expression = { kind: "literal", value };
      return expression;
    }
    const expression = this.atom(token, depth);
    return expression;
  }

  private atom(token: string, depth: number): Expression {
    if (/^[\d.]/.test(token)) {
      const expression = this.number(token);
      return expression;
    }
    const name = token.toUpperCase();
    if (this.token === "(") {
      if (name !== "SUM") throw new FormulaFault("unsupported", `Unsupported function: ${name}`);
      const expression = this.sum(depth + 1);
      return expression;
    }
    const boolean = name === "TRUE" || name === "FALSE";
    if (boolean) {
      const value = name === "TRUE";
      const expression: Expression = { kind: "literal", value };
      return expression;
    }
    const expression = this.reference(name);
    return expression;
  }

  private number(token: string): Expression {
    const value = Number(token);
    if (!Number.isFinite(value)) throw new FormulaFault("number", "Nonfinite number", "#NUM!");
    const expression: Expression = { kind: "literal", value };
    return expression;
  }

  private reference(token: string): Expression {
    if (!/^\$?[A-Z]+\$?\d+$/.test(token))
      throw new FormulaFault("unsupported", `Unsupported name: ${token}`);
    const start = readAddress(token);
    if (this.token !== ":") {
      const expression: Expression = { kind: "reference", address: start };
      return expression;
    }
    this.advance();
    const end = readAddress(this.token);
    this.advance();
    const reversed = start.row > end.row || start.column > end.column;
    if (reversed) throw new FormulaFault("reference", "Reversed range", "#REF!");
    const expression: Expression = { kind: "range", start, end };
    return expression;
  }

  private sum(depth: number): Expression {
    checkDepth(depth);
    this.take("(");
    const args = [this.expression(depth)];
    while (this.token === ",") {
      this.advance();
      args[args.length] = this.expression(depth);
    }
    this.take(")");
    const expression: Expression = { kind: "sum", args };
    return expression;
  }
}
