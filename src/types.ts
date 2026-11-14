import type { CellStyle, ColumnDefinition } from "./schemas/index.js";
import type { Worksheet } from "./xlsx/types.js";

export interface Workbook {
  sheets: Worksheet[];
}

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

export interface SheetDataAPI {
  getRowsData: () => DataRow[];
  getColumnData: () => ColumnData;
  getRowStyles?: (rowIndex?: number) => CellStyle;
  getColumnStyles?: (columnKey?: string) => CellStyle;
  updateRowStyles?: (rowIndex: number, styles: CellStyle) => void;
  updateColumnStyles?: (columnKey: string, styles: CellStyle) => void;
  updateRowData: (rowIndex: number, data: DataRow) => void;
  updateColumnData: (columnKey: string, data: unknown[]) => void;
  updateCellData: (address: string, value: unknown) => void;
}

export interface CellProcessingParams {
  rowData: DataRow;
  rowIndex: number;
  column: ColumnDefinition;
  columnIndex: number;
  allData: DataRow[];
}

export interface PatternContextParams {
  rowIndex: number;
  colIndex: number;
  rowData: DataRow;
  columnKey: string;
  value: unknown;
  previousRowData?: DataRow;
  allData: DataRow[];
}

export interface CellStyleParams {
  column: ColumnDefinition;
  rowIndex: number;
  defaultStyle?: CellStyle;
}
