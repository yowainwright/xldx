export type WidthCalculationMethod = "max" | "avg" | "median";

export interface WidthCalculationOptions {
  method?: WidthCalculationMethod;
  minWidth?: number;
  maxWidth?: number;
  padding?: number;
  wrapText?: boolean;
  sampleSize?: number;
  charWidth?: number;
}

export interface TextMatch {
  fastMatch?: string;
  pattern?: RegExp;
  caseSensitive?: boolean;
}

export interface WidthResult {
  width: number;
  wrapText?: boolean;
}

export type DataRow = Record<string, unknown>;

export type ColumnData = Record<string, unknown[]>;

export interface Sheet {
  name: string;
  data: ColumnData;
}

export interface SheetsData {
  name?: string;
  sheets: Sheet[];
  [key: string]: unknown;
}

// Style types
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

export type PatternFunction = (
  context: PatternContext,
) => Partial<CellStyle> | null;

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
  debug?: boolean;
}

// Schema aliases for compatibility
export type FontStyleSchema = FontStyle;
export type FillStyleSchema = FillStyle;
export type BorderStyleSchema = BorderStyle;
export type BordersStyleSchema = BordersStyle;
export type AlignmentStyleSchema = AlignmentStyle;
export type CellStyleSchema = CellStyle;
export type PatternContextSchema = PatternContext;
export type PatternFunctionSchema = PatternFunction;
export type ColumnPatternSchema = ColumnPattern;
export type RowStyleOverrideSchema = RowStyleOverride;
export type ColumnDefinitionSchema = ColumnDefinition;
export type SheetOptionsSchema = SheetOptions;
export type XldxOptionsSchema = XldxOptions;

export interface SheetDataAPI {
  getRowsData: () => DataRow[];
  getColumnData: () => ColumnData;
  getRowStyles?: (rowIndex?: number) => CellStyle;
  getColumnStyles?: (columnKey?: string) => CellStyle;
  updateRowStyles?: (rowIndex: number, styles: CellStyle) => void;
  updateColumnStyles?: (columnKey: string, styles: CellStyle) => void;
  updateRowData: (rowIndex: number, data: DataRow) => void;
  updateColumnData: (columnKey: string, data: unknown[]) => void;
}

export interface CellProcessingParams {
  rowData: DataRow;
  rowIndex: number;
  column: ColumnDefinition;
  columnIndex: number;
  allData: DataRow[];
  defaultStyle?: CellStyle;
}

export interface WorksheetView {
  state?: "frozen";
  xSplit?: number;
  ySplit?: number;
  showGridLines?: boolean;
  showRowColHeaders?: boolean;
}

export interface SerializedSheet {
  name: string;
  data: unknown[][];
  columnWidths?: number[];
}

export interface SerializedWorkbook {
  sheets: SerializedSheet[];
}

// Plugin types
import type { Worksheet } from "./xlsx/types";

export interface Relationship {
  readonly id: string;
  readonly type: string;
  readonly target: string;
}

export interface WorkbookContext {
  readonly worksheets: readonly Worksheet[];
  addFile(path: string, content: string | Uint8Array): void;
  getFile(path: string): string | Uint8Array | undefined;
}

export interface PluginReadContext {
  readonly files: ReadonlyMap<string, string | Uint8Array>;
  getFile(path: string): string | Uint8Array | undefined;
}

export interface XldxPlugin {
  readonly name: string;
  readonly version: string;

  /** Called before generating the XLSX file */
  beforeGenerate?(context: WorkbookContext): void;

  /** Called after generating all XML, before zipping */
  afterGenerate?(files: Map<string, string | Uint8Array>): void;

  /** Called when reading an XLSX file to extract plugin-specific data */
  parseContent?(context: PluginReadContext): unknown;

  /** Returns additional content type overrides for [Content_Types].xml */
  getContentTypes?(): readonly string[];

  /** Returns additional relationships for workbook.xml.rels */
  getRelationships?(): readonly Relationship[];
}
