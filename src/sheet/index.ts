import type {
  ColumnDefinition,
  SheetOptions,
  CellStyle,
  PatternFunction,
  PatternContext,
} from "../schemas/index.js";
import type { DataRow, ColumnData, CellProcessingParams } from "../types.js";
import type { Worksheet } from "../xlsx/types.js";
import { cellAddress, normalizeFormula, parseAddress } from "../formula/utils.js";
import type { SpillRange } from "../formula/types.js";
import { calculateWorkbook } from "../formula/calculate/index.js";
import {
  applyPattern,
  buildPatternContext,
  resolveCellStyles,
  createSetWidthBasedOnCharacterCount,
} from "../utils.js";

export class Sheet {
  private data: DataRow[];
  private columns: ColumnDefinition[];
  private options: SheetOptions;
  private customPatterns: Record<string, PatternFunction>;
  private headerRow: unknown[] | undefined;

  constructor(
    data: DataRow[],
    columns: ColumnDefinition[],
    options: SheetOptions,
    customPatterns: Record<string, PatternFunction> = {},
  ) {
    this.data = data;
    this.columns = columns;
    this.options = options;
    this.customPatterns = customPatterns;
    this.headerRow = columns.map((column) => column.header || column.key);
  }

  static fromWorksheet(worksheet: Worksheet): Sheet {
    const source = Sheet.readSource(worksheet);
    source.forEach(Sheet.normalizeRow);
    const data = Array.from(source.slice(1), Sheet.readWorksheetRow);
    const columns = Sheet.readWorksheetColumns(worksheet, source);
    const { name } = worksheet;
    const sheet = new Sheet(data, columns, { name });
    const hasRows = worksheet.data.length > 0;
    sheet.headerRow = hasRows ? (source[0]?.slice() ?? []) : undefined;
    return sheet;
  }

  private static readSource(worksheet: Worksheet): unknown[][] {
    const { data: source, spills } = worksheet;
    const data = Array.from(source, (row) => {
      const cells = row?.slice() ?? [];
      return cells;
    });
    if (!spills?.length) return data;
    spills.forEach((range) => Sheet.clearSpill(data, range));
    Sheet.validateSpills(worksheet.name, data, spills);
    return data;
  }

  private static validateSpills(name: string, data: unknown[][], expected: SpillRange[]): void {
    const sheet = { name, data };
    const sheets = [sheet];
    const calculated = calculateWorkbook({ sheets });
    const actual = calculated.workbook.sheets[0].spills ?? [];
    const anchors = actual.map((range) => cellAddress(range.row, range.column));
    const supported = new Set(anchors);
    const missing = expected.find((range) => {
      const address = cellAddress(range.row, range.column);
      const unsupported = !supported.has(address);
      return unsupported;
    });
    if (!missing) return;
    const address = cellAddress(missing.row, missing.column);
    throw new TypeError(`Cannot restore unsupported dynamic array at ${address}`);
  }

  private static clearSpill(data: unknown[][], range: SpillRange): void {
    const count = range.rows * range.columns;
    for (let index = 1; index < count; index++) {
      const row = range.row + Math.floor(index / range.columns);
      const column = range.column + (index % range.columns);
      const cells = data[row];
      if (cells) cells[column] = null;
    }
  }

  private static readWorksheetRow(row: unknown[] = []): DataRow {
    const entries = Array.from(row, (value, index) => [String(index), value]);
    const record: DataRow = Object.fromEntries(entries);
    return record;
  }

  private static readWorksheetColumns(worksheet: Worksheet, data: unknown[][]): ColumnDefinition[] {
    const widths = worksheet.columnWidths || [];
    const count = data.reduce((maximum, row) => {
      const width = Math.max(maximum, row.length);
      return width;
    }, widths.length);
    const columns = Array.from({ length: count }, (_, index) => {
      const key = String(index);
      const width = widths[index];
      const column = { key, width };
      return column;
    });
    return columns;
  }

  private calculateColumnWidth(column: ColumnDefinition): number | undefined {
    const { width } = column;
    const isNumberWidth = typeof width === "number";
    const isAutoWidth = width === "auto";

    if (isNumberWidth) {
      return width;
    }

    if (isAutoWidth) {
      const columnData = this.data.map((row) => row[column.key]);
      const widthResult = createSetWidthBasedOnCharacterCount(columnData)();
      const width = widthResult?.width;
      return width;
    }

    return undefined;
  }

  private buildProcessedData(): unknown[][] {
    const processedRows = this.data.map((row, index) => this.buildProcessedRow(row, index));
    const { headerRow } = this;
    if (!headerRow) return processedRows;
    const dataArray = [headerRow].concat(processedRows);
    return dataArray;
  }

  private buildProcessedRow(rowData: DataRow, rowIndex: number): unknown[] {
    const { data: allData } = this;
    const row = this.columns.map((column, columnIndex) => {
      const params = { rowData, rowIndex, column, columnIndex, allData };
      const context = this.createPatternContext(params);
      const value = rowData[column.key];
      const cell = this.applyPatternStyles(value, context, column.patterns);
      return cell;
    });
    return row;
  }

  private createPatternContext(params: CellProcessingParams) {
    const { rowData, rowIndex, column, columnIndex: colIndex, allData } = params;
    const { key: columnKey } = column;
    const value = rowData[columnKey];
    const previousRowData = rowIndex > 0 ? allData[rowIndex - 1] : undefined;
    const context = buildPatternContext({
      rowIndex,
      colIndex,
      rowData,
      columnKey,
      value,
      previousRowData,
      allData,
    });
    return context;
  }

  private applyPatternStyles(
    value: unknown,
    context: PatternContext,
    patterns: ColumnDefinition["patterns"],
  ): unknown {
    if (!patterns) return value;

    applyPattern(patterns.bgColorPattern, context, this.customPatterns);
    applyPattern(patterns.textPattern, context, this.customPatterns);
    if (patterns.custom) {
      patterns.custom.forEach((pattern) => applyPattern(pattern, context, this.customPatterns));
    }

    return value;
  }

  public getRowsData(): DataRow[] {
    const rows = this.data.slice();
    return rows;
  }

  public getColumnData(): ColumnData {
    const columnData: ColumnData = {};
    const hasData = this.data.length > 0;
    if (!hasData) return columnData;

    const keys = this.columns.map((col) => col.key);
    keys.forEach((key) => {
      columnData[key] = this.readColumn(key);
    });

    return columnData;
  }

  private readColumn(key: string): unknown[] {
    const values = this.data.map((row) => row[key]);
    return values;
  }

  public getRowStyles(rowIndex?: number): CellStyle {
    const empty: CellStyle = {};
    const hasIndex = rowIndex !== undefined;
    if (!hasIndex) return empty;
    const column = this.columns[0];
    if (!column) return empty;
    const { defaultStyle } = this.options;
    const style = resolveCellStyles({ column, rowIndex, defaultStyle }) || empty;
    return style;
  }

  public getColumnStyles(columnKey?: string): CellStyle {
    const empty: CellStyle = {};
    const hasKey = columnKey !== undefined;
    if (!hasKey) return empty;
    const column = this.columns.find((col) => col.key === columnKey);
    const style = column?.style || empty;
    return style;
  }

  public updateRowStyles(rowIndex: number, styles: CellStyle): void {
    const isValidIndex = rowIndex >= 0 && rowIndex < this.data.length;
    if (!isValidIndex) return;

    this.columns.forEach((column) => {
      const rows = column.rows ?? {};
      rows[rowIndex + 2] = styles;
      column.rows = rows;
    });
  }

  public updateColumnStyles(columnKey: string, styles: CellStyle): void {
    const column = this.columns.find((col) => col.key === columnKey);
    if (!column) return;

    column.style = { ...column.style, ...styles };
  }

  public updateRowData(rowIndex: number, data: DataRow): void {
    const isValidIndex = rowIndex >= 0 && rowIndex < this.data.length;
    if (!isValidIndex) return;
    Object.values(data).forEach(normalizeFormula);

    this.data[rowIndex] = { ...this.data[rowIndex], ...data };
  }

  public updateColumnData(columnKey: string, data: unknown[]): void {
    const columnIndex = this.columns.findIndex((col) => col.key === columnKey);
    const hasColumn = columnIndex !== -1;
    if (!hasColumn) return;
    data.forEach(normalizeFormula);

    data.forEach((value, rowIndex) => {
      const isValidRow = rowIndex < this.data.length;
      if (isValidRow) {
        this.data[rowIndex][columnKey] = value;
      }
    });
  }

  public getColData(columnKey: string | number) {
    const targetColumnKey = this.findColumnKey(columnKey);
    if (!targetColumnKey) {
      throw new Error(`Column ${columnKey} not found`);
    }
    const data = this.readColumn(targetColumnKey);
    const updateStyles = this.updateColumnStyles.bind(this, targetColumnKey);
    const column = { data, updateStyles };
    return column;
  }

  public updateCellData(address: string, value: unknown): void {
    const { row, column } = parseAddress(address);
    const definition = this.columns[column];
    const invalid = !definition || row > this.data.length;
    if (invalid) throw new RangeError(`Cell outside worksheet: ${address}`);
    normalizeFormula(value);
    if (row === 0) {
      if (!this.headerRow) throw new RangeError(`Cell outside worksheet: ${address}`);
      this.headerRow[column] = value;
      return;
    }
    this.data[row - 1][definition.key] = value;
  }

  private findColumnKey(identifier: string | number): string | undefined {
    const isKey = typeof identifier === "string";
    const column = isKey
      ? this.columns.find((item) => item.key === identifier)
      : this.columns[identifier];
    const key = column?.key;
    return key;
  }

  public getRowData(rowIndex: number) {
    const isInvalidIndex = rowIndex < 0 || rowIndex >= this.data.length;
    if (isInvalidIndex) {
      throw new Error(`Row ${rowIndex} not found`);
    }

    const data = this.data[rowIndex];
    const updateStyles = this.updateRowStyles.bind(this, rowIndex);
    const row = { data, updateStyles };
    return row;
  }

  public toWorksheetData(): { data: unknown[][]; columnWidths?: number[] } {
    const widths = this.columns
      .map((col) => this.calculateColumnWidth(col))
      .filter((width) => width !== undefined);

    const data = this.buildProcessedData().map(Sheet.normalizeRow);
    const columnWidths = widths.length > 0 ? widths : undefined;
    const worksheet = { data, columnWidths };
    return worksheet;
  }

  private static normalizeRow(row: unknown[]): unknown[] {
    const normalized = row.map((value) => normalizeFormula(value) ?? value);
    return normalized;
  }
}
