export type ValidationType =
  | "list"
  | "whole"
  | "decimal"
  | "date"
  | "time"
  | "textLength"
  | "custom";

export type ValidationOperator =
  | "between"
  | "notBetween"
  | "equal"
  | "notEqual"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual";

export type ValidationErrorStyle = "stop" | "warning" | "information";

export interface BaseValidation {
  /** Cell range in A1 notation (e.g., "B2:B100") */
  range: string;
  /** Sheet name (required when adding validation) */
  sheet?: string;
  /** Allow blank cells */
  allowBlank?: boolean;
  /** Show dropdown arrow for list validation */
  showDropDown?: boolean;
  /** Show input message when cell is selected */
  showInputMessage?: boolean;
  /** Input message title */
  promptTitle?: string;
  /** Input message text */
  prompt?: string;
  /** Show error alert on invalid input */
  showErrorMessage?: boolean;
  /** Error alert style */
  errorStyle?: ValidationErrorStyle;
  /** Error alert title */
  errorTitle?: string;
  /** Error alert message */
  error?: string;
}

export interface ListValidation extends BaseValidation {
  type: "list";
  /** List of allowed values */
  values: string[];
}

export interface NumericValidation extends BaseValidation {
  type: "whole" | "decimal";
  operator: ValidationOperator;
  /** First value for comparison (or min for 'between') */
  value1?: number;
  /** Second value for 'between'/'notBetween' operators */
  value2?: number;
}

export interface DateValidation extends BaseValidation {
  type: "date";
  operator: ValidationOperator;
  /** First date for comparison */
  value1?: Date | string;
  /** Second date for 'between'/'notBetween' operators */
  value2?: Date | string;
}

export interface TimeValidation extends BaseValidation {
  type: "time";
  operator: ValidationOperator;
  /** First time for comparison (format: "HH:MM:SS") */
  value1?: string;
  /** Second time for 'between'/'notBetween' operators */
  value2?: string;
}

export interface TextLengthValidation extends BaseValidation {
  type: "textLength";
  operator: ValidationOperator;
  /** First length value for comparison */
  value1?: number;
  /** Second length value for 'between'/'notBetween' operators */
  value2?: number;
}

export interface CustomValidation extends BaseValidation {
  type: "custom";
  /** Custom formula (e.g., "=AND(A1>0,A1<100)") */
  formula: string;
}

export type ValidationRule =
  | ListValidation
  | NumericValidation
  | DateValidation
  | TimeValidation
  | TextLengthValidation
  | CustomValidation;
