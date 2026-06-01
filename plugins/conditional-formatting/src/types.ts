export type ConditionalFormatType =
  | "colorScale"
  | "dataBar"
  | "iconSet"
  | "cellIs"
  | "expression";

export interface ColorScaleRule {
  readonly type: "colorScale";
  readonly range: string;
  readonly colors:
    | readonly [string, string]
    | readonly [string, string, string];
  readonly sheet?: string;
}

export interface DataBarRule {
  readonly type: "dataBar";
  readonly range: string;
  readonly color: string;
  readonly showValue?: boolean;
  readonly sheet?: string;
}

export type IconSetType =
  | "3Arrows"
  | "3ArrowsGray"
  | "3Flags"
  | "3TrafficLights1"
  | "3TrafficLights2"
  | "3Signs"
  | "3Symbols"
  | "3Symbols2"
  | "4Arrows"
  | "4ArrowsGray"
  | "4Rating"
  | "4RedToBlack"
  | "4TrafficLights"
  | "5Arrows"
  | "5ArrowsGray"
  | "5Rating"
  | "5Quarters";

export interface IconSetRule {
  readonly type: "iconSet";
  readonly range: string;
  readonly iconSet: IconSetType;
  readonly sheet?: string;
}

export type CellIsOperator =
  | "equal"
  | "notEqual"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual"
  | "between"
  | "notBetween";

export interface RuleStyle {
  readonly bgColor?: string;
  readonly fontColor?: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
}

export interface CellIsRule {
  readonly type: "cellIs";
  readonly range: string;
  readonly operator: CellIsOperator;
  readonly value: number | string;
  readonly value2?: number | string;
  readonly style: RuleStyle;
  readonly sheet?: string;
}

export interface ExpressionRule {
  readonly type: "expression";
  readonly range: string;
  readonly formula: string;
  readonly style: RuleStyle;
  readonly sheet?: string;
}

export type ConditionalFormatRule =
  | ColorScaleRule
  | DataBarRule
  | IconSetRule
  | CellIsRule
  | ExpressionRule;

export interface InternalRule {
  sheetIndex: number;
  rule: ConditionalFormatRule;
  priority: number;
}
