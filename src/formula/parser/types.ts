import type { Address } from "../types.js";

export type Scalar = number | string | boolean | null;
export type Operator = "+" | "-" | "*" | "/";
export type ValueExpression =
  | { kind: "literal"; value: Scalar }
  | { kind: "reference"; address: Address }
  | { kind: "range"; start: Address; end: Address }
  | { kind: "sum"; args: Expression[] };
export type Expression =
  | ValueExpression
  | { kind: "unary"; operator: "+" | "-"; value: Expression }
  | { kind: "binary"; operator: Operator; left: Expression; right: Expression };
