import type {
  ColumnDefinition,
  SheetOptions,
  CellStyle,
  PatternFunction,
  PatternContext
} from './schemas';
import type { DataRow, ColumnData } from './types';
import {
  applyPattern,
  buildPatternContext,
  resolveCellStyles,
  createSetWidthBasedOnCharacterCount
} from './utils';

export class Sheet {
  private data: DataRow[];
  private columns: ColumnDefinition[];
  private options: SheetOptions;
  private customPatterns: Record<string, PatternFunction>;
  private processedData: any[][];

  constructor(
    data: DataRow[],
    columns: ColumnDefinition[],
    options: SheetOptions,
    customPatterns: Record<string, PatternFunction> = {}
  ) {
    this.data = data;
    this.columns = columns;
    this.options = options;
    this.customPatterns = customPatterns;
    this.processedData = [];
    
    this.initialize();
  }

  private initialize(): void {
    this.processedData = this.buildProcessedData();
  }

  private calculateColumnWidth(column: ColumnDefinition): number | undefined {
    const isNumberWidth = typeof column.width === 'number';
    const isAutoWidth = column.width === 'auto';

    if (isNumberWidth) return column.width as number;

    if (isAutoWidth) {
      const columnData = this.data.map(row => row[column.key]);
      const widthResult = createSetWidthBasedOnCharacterCount(columnData)();
      return widthResult?.width;
    }

    return undefined;
  }

  private buildProcessedData(): any[][] {
    const dataArray: any[][] = [];
    
    const headerRow = this.columns.map(col => col.header || col.key);
    dataArray.push(headerRow);

    const processedRows = this.data.map((rowData, rowIndex) => {
      return this.columns.map((col, colIndex) => {
        const context = buildPatternContext({
          rowIndex,
          colIndex,
          rowData,
          columnKey: col.key,
          value: rowData[col.key],
          previousRowData: rowIndex > 0 ? this.data[rowIndex - 1] : undefined,
          allData: this.data
        });
        
        return this.applyPatternStyles(rowData[col.key], context, col.patterns);
      });
    });

    dataArray.push(...processedRows);
    return dataArray;
  }

  private applyPatternStyles(
    value: unknown,
    context: PatternContext,
    patterns: ColumnDefinition['patterns']
  ): unknown {
    const hasNoPatterns = !patterns;
    if (hasNoPatterns) return value;

    applyPattern(patterns.bgColorPattern, context, this.customPatterns);
    applyPattern(patterns.textPattern, context, this.customPatterns);
    const hasCustomPatterns = patterns.custom && patterns.custom.length > 0;

    if (hasCustomPatterns) {
      patterns.custom!.map(pattern =>
        applyPattern(pattern, context, this.customPatterns)
      ).filter(style => style !== null);
    }

    return value;
  }

  public getRowsData(): DataRow[] {
    return [...this.data];
  }

  public getColumnData(): ColumnData {
    const columnData: ColumnData = {};
    const hasNoData = this.data.length === 0;
    if (hasNoData) return columnData;
    
    const keys = this.columns.map(col => col.key);
    keys.forEach(key => {
      columnData[key] = this.data.map(row => row[key]);
    });
    
    return columnData;
  }

  public getRowStyles(rowIndex?: number): CellStyle {
    const hasNoIndex = rowIndex === undefined;
    if (hasNoIndex) return {};
    
    const column = this.columns[0];
    const hasNoColumn = !column;
    if (hasNoColumn) return {};
    
    return resolveCellStyles({
      column,
      rowIndex,
      defaultStyle: this.options.defaultStyle
    }) || {};
  }

  public getColumnStyles(columnKey?: string): CellStyle {
    const hasNoKey = columnKey === undefined;
    if (hasNoKey) return {};
    
    const column = this.columns.find(col => col.key === columnKey);
    const hasNoColumn = !column;
    if (hasNoColumn) return {};
    
    return column.style || {};
  }

  public updateRowStyles(rowIndex: number, styles: CellStyle): void {
    const isValidIndex = rowIndex >= 0 && rowIndex < this.data.length;
    if (!isValidIndex) return;
    
    this.columns.forEach(column => {
      const hasNoRowStyles = !column.rows;
      if (hasNoRowStyles) {
        column.rows = {};
      }
      column.rows![rowIndex + 2] = styles;
    });
  }

  public updateColumnStyles(columnKey: string, styles: CellStyle): void {
    const column = this.columns.find(col => col.key === columnKey);
    const hasNoColumn = !column;
    if (hasNoColumn) return;
    
    column.style = { ...column.style, ...styles };
  }

  public updateRowData(rowIndex: number, data: DataRow): void {
    const isValidIndex = rowIndex >= 0 && rowIndex < this.data.length;
    if (!isValidIndex) return;
    
    this.data[rowIndex] = { ...this.data[rowIndex], ...data };
    this.processedData = this.buildProcessedData();
  }

  public updateColumnData(columnKey: string, data: unknown[]): void {
    const columnIndex = this.columns.findIndex(col => col.key === columnKey);
    const hasNoColumn = columnIndex === -1;
    if (hasNoColumn) return;
    
    data.forEach((value, rowIndex) => {
      const isValidRow = rowIndex < this.data.length;
      if (isValidRow) {
        this.data[rowIndex][columnKey] = value;
      }
    });
    
    this.processedData = this.buildProcessedData();
  }

  public getColData(columnKey: string | number) {
    let targetColumnKey: string;
    let colIndex: number;

    const isStringKey = typeof columnKey === 'string';
    if (isStringKey) {
      targetColumnKey = columnKey;
      colIndex = this.columns.findIndex(col => col.key === columnKey);
    } else {
      colIndex = columnKey;
      const hasColumn = colIndex >= 0 && colIndex < this.columns.length;
      targetColumnKey = hasColumn ? this.columns[colIndex].key : '';
    }

    const hasNoColumn = colIndex === -1 || !targetColumnKey;
    if (hasNoColumn) {
      throw new Error(`Column ${columnKey} not found`);
    }

    const columnData = this.data.map(row => row[targetColumnKey]);

    return {
      data: columnData,
      updateStyles: (styles: CellStyle) => {
        this.updateColumnStyles(targetColumnKey, styles);
      }
    };
  }

  public getRowData(rowIndex: number) {
    const isInvalidIndex = rowIndex < 0 || rowIndex >= this.data.length;
    if (isInvalidIndex) {
      throw new Error(`Row ${rowIndex} not found`);
    }

    const rowData = this.data[rowIndex];

    return {
      data: rowData,
      updateStyles: (styles: CellStyle) => {
        this.updateRowStyles(rowIndex, styles);
      }
    };
  }

  public toWorksheetData(): { data: any[][]; columnWidths?: number[] } {
    const columnWidths = this.columns
      .map(col => this.calculateColumnWidth(col))
      .filter(width => width !== undefined) as number[];

    return {
      data: this.processedData,
      columnWidths: columnWidths.length > 0 ? columnWidths : undefined
    };
  }
}