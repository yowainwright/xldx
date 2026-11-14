import type { FormulaError, IssueCode } from "../types.js";
import { MAX_DEPTH } from "../constants.js";
import { parseAddress } from "../utils.js";
import type { Address } from "../types.js";

export class FormulaFault extends Error {
  constructor(
    readonly code: IssueCode,
    message: string,
    readonly error?: FormulaError,
  ) {
    super(message);
  }
}

export function checkDepth(depth: number): void {
  if (depth > MAX_DEPTH) throw new FormulaFault("limit", "Formula nesting limit exceeded");
}

export function readAddress(text: string): Address {
  try {
    const address = parseAddress(text);
    return address;
  } catch {
    throw new FormulaFault("reference", `Invalid reference: ${text}`, "#REF!");
  }
}
