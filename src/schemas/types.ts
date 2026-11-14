export interface FontStyle {
  name?: string;
  size?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
}
export interface FillStyle {
  type?: "pattern" | "gradient";
  pattern?: "solid" | "none" | "gray125" | "darkHorizontal" | "darkVertical";
  fgColor?: string;
  bgColor?: string;
}
export interface BorderStyle {
  style?: "thin" | "medium" | "thick" | "double" | "dotted" | "dashed" | "none";
  color?: string;
}
export interface BordersStyle {
  top?: BorderStyle;
  left?: BorderStyle;
  bottom?: BorderStyle;
  right?: BorderStyle;
  diagonal?: BorderStyle;
  diagonalUp?: boolean;
  diagonalDown?: boolean;
}
export interface AlignmentStyle {
  horizontal?:
    | "left"
    | "center"
    | "right"
    | "fill"
    | "justify"
    | "centerContinuous"
    | "distributed";
  vertical?: "top" | "middle" | "bottom" | "distributed" | "justify";
  wrapText?: boolean;
  shrinkToFit?: boolean;
  indent?: number;
  readingOrder?: number;
  textRotation?: number;
}
export interface CellStyle {
  font?: FontStyle;
  fill?: FillStyle;
  border?: BordersStyle;
  alignment?: AlignmentStyle;
  numFmt?: string;
}
export interface PatternContext {
  rowIndex: number;
  columnIndex: number;
  value: unknown;
  previousValue?: unknown;
  rowData: Record<string, unknown>;
  allData: Record<string, unknown>[];
  columnKey: string;
}
export type PatternFunction = (context: PatternContext) => Partial<CellStyle> | null;
export interface ColumnPattern {
  bgColorPattern?: string | PatternFunction;
  textPattern?: string | PatternFunction;
  custom?: Array<string | PatternFunction>;
}
export interface RowStyleOverride {
  [rowNumber: number]: CellStyle;
}
export interface ColumnDefinition {
  key: string;
  header?: string;
  width?: number | "auto";
  style?: CellStyle;
  patterns?: ColumnPattern;
  rows?: RowStyleOverride;
}
export interface SheetOptions {
  name: string;
  freezePane?: {
    row: number;
    column: number;
  };
  showGridLines?: boolean;
  showRowColHeaders?: boolean;
  defaultRowHeight?: number;
  defaultStyle?: CellStyle;
}
export interface XldxOptions {
  customPatterns?: Record<string, PatternFunction>;
}
