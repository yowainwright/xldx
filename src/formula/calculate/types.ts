import type { Scalar } from "../parser/types.js";
import type { FormulaFault } from "../parser/utils.js";

export type Outcome = { value: Scalar } | { failure: FormulaFault };
