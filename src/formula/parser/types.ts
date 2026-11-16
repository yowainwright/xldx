import type { Address, FormulaResult } from "../types.js";

export type Scalar = FormulaResult | null;
export type Value = Scalar | Scalar[][];
export type Operator = "+" | "-" | "*" | "/";
export type ValueExpression =
  | { kind: "literal"; value: Scalar }
  | { kind: "reference"; address: Address }
  | { kind: "range"; start: Address; end: Address }
  | { kind: "sum"; args: Expression[] }
  | { kind: "call"; name: "SEQUENCE" | "MID"; args: Expression[] };
export type Expression =
  | ValueExpression
  | { kind: "unary"; operator: "+" | "-"; value: Expression }
  | { kind: "binary"; operator: Operator; left: Expression; right: Expression };
