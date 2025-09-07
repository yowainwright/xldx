import ExcelJS from "exceljs";
import type { 
  ColumnDefinition, 
  SheetOptions, 
  XldxOptions,
  PatternFunction,
  CellStyle,
  PatternContext
} from "./schemas";
import type { ColorTheme } from "./themes";
import type { DataRow, SheetsData, ColumnData } from "./types";
import { 
  setTheme,
  zebraBg,
  bgColorBasedOnDiff,
  colorPerDiff,
  txtColorBasedOnDiff,
  createSetWidthBasedOnCharacterCount,
  customizeInput,
  builtInPatterns
} from "./utils";

export class Xldx {
  private workbook: ExcelJS.Workbook;
  private data: DataRow[] | SheetsData;
  private customPatterns: Record<string, PatternFunction>;
  private currentSheetData: DataRow[] = [];

  public readonly zebraBg: PatternFunction;
  public readonly bgColorBasedOnDiff: PatternFunction;
  public readonly colorPerDiff: PatternFunction;
  public readonly txtColorBasedOnDiff: PatternFunction;
  public readonly createSetWidthBasedOnCharacterCount = createSetWidthBasedOnCharacterCount.bind(this);
  public readonly customizeInput = customizeInput.bind(this);

  constructor(data: DataRow[] | SheetsData, options: XldxOptions = {}) {
    this.workbook = new ExcelJS.Workbook();
    this.data = data;
    this.customPatterns = options.customPatterns || {};
    
    this.workbook.creator = "Xldx";
    this.workbook.created = new Date();
    this.workbook.modified = new Date();

    if (!Array.isArray(data) && 'sheets' in data) {
      this.buildSheetsFromData();
    }

    this.zebraBg = zebraBg.bind(this);
    this.bgColorBasedOnDiff = bgColorBasedOnDiff.bind(this);
    this.colorPerDiff = colorPerDiff.bind(this);
    this.txtColorBasedOnDiff = txtColorBasedOnDiff.bind(this);
  }

  setTheme(theme: ColorTheme): this {
    setTheme(theme);
    return this;
  }

  createColumn(definition: ColumnDefinition): ColumnDefinition {
    return definition;
  }

  createColumns(definitions: ColumnDefinition[]): ColumnDefinition[] {
    return definitions;
  }

  private applyPatternStyles(
    cell: ExcelJS.Cell,
    context: PatternContext,
    patterns: ColumnDefinition["patterns"]
  ): void {
    if (!patterns) return;

    const applyPattern = (pattern: string | PatternFunction | undefined) => {
      if (!pattern) return null;

      const isString = typeof pattern === "string";
      const isFunction = typeof pattern === "function";

      if (isString) {
        const builtIn = builtInPatterns[pattern as keyof typeof builtInPatterns];
        if (builtIn) return builtIn(context);
        
        const custom = this.customPatterns[pattern];
        if (custom) return custom(context);
      }

      if (isFunction) {
        return pattern(context);
      }

      return null;
    };

    const bgStyle = applyPattern(patterns.bgColorPattern);
    const textStyle = applyPattern(patterns.textPattern);
    
    if (bgStyle) this.applyCellStyle(cell, bgStyle);
    if (textStyle) this.applyCellStyle(cell, textStyle);

    if (patterns.custom) {
      patterns.custom.forEach(pattern => {
        const style = applyPattern(pattern);
        if (style) this.applyCellStyle(cell, style);
      });
    }
  }

  private applyCellStyle(cell: ExcelJS.Cell, style: Partial<CellStyle>): void {
    if (style.font) {
      cell.font = style.font as any;
    }
    if (style.fill) {
      cell.fill = style.fill as ExcelJS.Fill;
    }
    if (style.border) {
      cell.border = style.border as ExcelJS.Borders;
    }
    if (style.alignment) {
      const alignment: any = { ...style.alignment };
      if (alignment.readingOrder !== undefined) {
        alignment.readingOrder = alignment.readingOrder === 1 ? 'ltr' : 'rtl';
      }
      cell.alignment = alignment as ExcelJS.Alignment;
    }
    if (style.numFmt) {
      cell.numFmt = style.numFmt;
    }
  }

  private convertColumnDataToRows(columnData: ColumnData): DataRow[] {
    const columns = Object.keys(columnData);
    if (columns.length === 0) return [];
    
    const rowCount = Math.max(...columns.map(col => columnData[col].length));
    const rows: DataRow[] = [];
    
    for (let i = 0; i < rowCount; i++) {
      const row: DataRow = {};
      for (const col of columns) {
        row[col] = columnData[col][i] ?? null;
      }
      rows.push(row);
    }
    
    return rows;
  }

  private buildSheetsFromData(): void {
    if (Array.isArray(this.data) || !('sheets' in this.data)) return;
    
    this.data.sheets.forEach(sheet => {
      const rows = this.convertColumnDataToRows(sheet.data);
      const columnKeys = Object.keys(sheet.data);
      const columns: ColumnDefinition[] = columnKeys.map(key => ({
        key,
        header: key,
        width: 'auto'
      }));
      
      this.currentSheetData = rows;
      this.createSheet({ name: sheet.name }, ...columns);
    });
  }

  createSheet(options: SheetOptions, ...columns: ColumnDefinition[]): this {
    if (Array.isArray(this.data)) {
      this.currentSheetData = this.data;
    }
    
    const worksheet = this.workbook.addWorksheet(options.name);
    
    if (options.freezePane) {
      worksheet.views = [{
        state: "frozen",
        xSplit: options.freezePane.column,
        ySplit: options.freezePane.row,
      }];
    }

    if (options.showGridLines !== undefined) {
      worksheet.views = [{
        ...worksheet.views?.[0],
        showGridLines: options.showGridLines,
      }];
    }

    if (options.showRowColHeaders !== undefined) {
      worksheet.views = [{
        ...worksheet.views?.[0],
        showRowColHeaders: options.showRowColHeaders,
      }];
    }

    worksheet.columns = columns.map(col => ({
      header: col.header || col.key,
      key: col.key,
      width: col.width === "auto" ? undefined : col.width,
    }));

    this.currentSheetData.forEach((rowData, rowIndex) => {
      const row = worksheet.addRow(rowData);
      
      if (options.defaultRowHeight) {
        row.height = options.defaultRowHeight;
      }

      columns.forEach((col, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        const actualRowIndex = rowIndex + 2;

        const hasRowOverride = col.rows && col.rows[actualRowIndex];
        if (hasRowOverride) {
          this.applyCellStyle(cell, col.rows![actualRowIndex]);
          return;
        }

        if (options.defaultStyle) {
          this.applyCellStyle(cell, options.defaultStyle);
        }

        if (col.style) {
          this.applyCellStyle(cell, col.style);
        }

        const context: PatternContext = {
          rowIndex: actualRowIndex,
          columnIndex: colIndex,
          value: rowData[col.key],
          previousValue: rowIndex > 0 ? this.currentSheetData[rowIndex - 1][col.key] : undefined,
          rowData,
          allData: this.currentSheetData,
          columnKey: col.key,
        };

        this.applyPatternStyles(cell, context, col.patterns);
      });
    });

    const headerRow = worksheet.getRow(1);
    columns.forEach((col, colIndex) => {
      const hasHeaderOverride = col.rows && col.rows[1];
      if (hasHeaderOverride) {
        const cell = headerRow.getCell(colIndex + 1);
        this.applyCellStyle(cell, col.rows![1]);
      }
    });

    return this;
  }

  createSheets(sheets: Array<{ options: SheetOptions; columns: ColumnDefinition[] }>): this {
    sheets.forEach(({ options, columns }) => {
      this.createSheet(options, ...columns);
    });
    return this;
  }

  async toBuffer(): Promise<Buffer> {
    return Buffer.from(await this.workbook.xlsx.writeBuffer());
  }

  async toUint8Array(): Promise<Uint8Array> {
    const buffer = await this.toBuffer();
    return new Uint8Array(buffer);
  }

  async write(filePath: string): Promise<void> {
    await this.workbook.xlsx.writeFile(filePath);
  }

  getWorkbook(): ExcelJS.Workbook {
    return this.workbook;
  }

}

export * from "./schemas";
export * from "./themes";
export * from "./types";