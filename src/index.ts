import { XlsxWriter, XlsxReader } from "./xlsx";
import type { 
  ColumnDefinition, 
  SheetOptions, 
  XldxOptions,
  PatternFunction,
  PatternContext
} from "./schemas";
import type { ColorTheme } from "./themes";
import type { DataRow, SheetsData, ColumnData, SheetDataAPI } from "./types";
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

export * from "./schemas";
export * from "./themes";
export * from "./types";

export class Xldx {
  protected writer: XlsxWriter;
  protected data: DataRow[] | SheetsData;
  protected customPatterns: Record<string, PatternFunction>;
  protected currentSheetData: DataRow[] = [];
  protected sheetDataMap: Map<string, DataRow[]> = new Map();
  protected sheetColumnsMap: Map<string, ColumnDefinition[]> = new Map();
  protected worksheets: Array<{
    name: string;
    data: any[][];
    columnWidths?: number[];
  }> = [];

  public readonly zebraBg: PatternFunction;
  public readonly bgColorBasedOnDiff: PatternFunction;
  public readonly colorPerDiff: PatternFunction;
  public readonly txtColorBasedOnDiff: PatternFunction;
  public readonly createSetWidthBasedOnCharacterCount = createSetWidthBasedOnCharacterCount.bind(this);
  public readonly customizeInput = customizeInput.bind(this);

  constructor(data: DataRow[] | SheetsData, options: XldxOptions = {}) {
    this.writer = new XlsxWriter();
    this.data = data;
    this.customPatterns = options.customPatterns || {};

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

  protected applyPatternStyles(
    value: any,
    context: PatternContext,
    patterns: ColumnDefinition["patterns"]
  ): any {
    if (!patterns) return value;

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

    applyPattern(patterns.bgColorPattern);
    applyPattern(patterns.textPattern);
    
    return value;
  }

  protected convertColumnDataToRows(columnData: ColumnData): DataRow[] {
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

  protected buildSheetsFromData(): void {
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
    
    this.sheetDataMap.set(options.name, [...this.currentSheetData]);
    this.sheetColumnsMap.set(options.name, [...columns]);
    
    const columnWidths = columns.map(col => {
      if (typeof col.width === 'number') return col.width;
      if (col.width === 'auto') return undefined;
      return undefined;
    });

    const dataArray: any[][] = [];
    
    const headerRow = columns.map(col => col.header || col.key);
    dataArray.push(headerRow);

    this.currentSheetData.forEach((rowData, rowIndex) => {
      const row = columns.map((col, colIndex) => {
        const value = rowData[col.key];
        
        const context: PatternContext = {
          rowIndex: rowIndex + 2,
          columnIndex: colIndex,
          value,
          previousValue: rowIndex > 0 ? this.currentSheetData[rowIndex - 1][col.key] : undefined,
          rowData,
          allData: this.currentSheetData,
          columnKey: col.key,
        };

        return this.applyPatternStyles(value, context, col.patterns);
      });
      dataArray.push(row);
    });

    this.worksheets.push({
      name: options.name,
      data: dataArray,
      columnWidths: columnWidths.filter(w => w !== undefined) as number[] | undefined
    });

    this.writer.addWorksheet(options.name, dataArray, columnWidths.filter(w => w !== undefined) as number[]);

    return this;
  }

  createSheets(sheets: Array<{ options: SheetOptions; columns: ColumnDefinition[] }>): this {
    sheets.forEach(({ options, columns }) => {
      this.createSheet(options, ...columns);
    });
    return this;
  }

  async toUint8Array(): Promise<Uint8Array> {
    return this.writer.generate();
  }

  toJSON(): any {
    return {
      sheets: this.worksheets.map(sheet => ({
        name: sheet.name,
        data: sheet.data,
        columnWidths: sheet.columnWidths
      }))
    };
  }

  getSheetData(sheet: string | number): SheetDataAPI {
    let sheetName: string;
    let sheetData: DataRow[] = [];
    let sheetColumns: ColumnDefinition[] = [];
    let worksheetData: any[][] | undefined;
    
    if (typeof sheet === 'string') {
      sheetName = sheet;
      sheetData = this.sheetDataMap.get(sheet) || [];
      sheetColumns = this.sheetColumnsMap.get(sheet) || [];
      worksheetData = this.worksheets.find(ws => ws.name === sheet)?.data;
    } else if (typeof sheet === 'number') {
      const worksheet = this.worksheets[sheet];
      if (worksheet) {
        sheetName = worksheet.name;
        sheetData = this.sheetDataMap.get(worksheet.name) || [];
        sheetColumns = this.sheetColumnsMap.get(worksheet.name) || [];
        worksheetData = worksheet.data;
      } else {
        throw new Error(`Sheet at index ${sheet} not found`);
      }
    } else {
      throw new Error(`Invalid sheet identifier: ${sheet}`);
    }
    
    if (!worksheetData) {
      throw new Error(`Sheet ${sheet} not found`);
    }
    
    const dataRef = sheetData;
    const columnsRef = sheetColumns;
    const worksheetDataRef = worksheetData;
    const sheetDataMap = this.sheetDataMap;
    const worksheets = this.worksheets;
    
    return {
      getRowsData: () => [...dataRef],
      
      getColumnData: (): ColumnData => {
        const columnData: ColumnData = {};
        if (dataRef.length === 0) return columnData;
        
        const keys = columnsRef.map(col => col.key);
        keys.forEach(key => {
          columnData[key] = dataRef.map(row => row[key]);
        });
        
        return columnData;
      },
      
      updateRowData: (rowIndex: number, data: DataRow) => {
        if (rowIndex >= 0 && rowIndex < dataRef.length) {
          dataRef[rowIndex] = { ...dataRef[rowIndex], ...data };
          sheetDataMap.set(sheetName, dataRef);
          
          const worksheetIndex = worksheets.findIndex(ws => ws.name === sheetName);
          if (worksheetIndex !== -1 && worksheetDataRef[rowIndex + 1]) {
            Object.entries(data).forEach(([key, value]) => {
              const colIndex = columnsRef.findIndex(col => col.key === key);
              if (colIndex !== -1) {
                worksheetDataRef[rowIndex + 1][colIndex] = value;
              }
            });
          }
        }
      },
      
      updateColumnData: (columnKey: string, data: unknown[]) => {
        const colIndex = columnsRef.findIndex(col => col.key === columnKey);
        if (colIndex !== -1) {
          data.forEach((value, rowIndex) => {
            if (rowIndex < dataRef.length) {
              dataRef[rowIndex][columnKey] = value;
              if (worksheetDataRef[rowIndex + 1]) {
                worksheetDataRef[rowIndex + 1][colIndex] = value;
              }
            }
          });
          sheetDataMap.set(sheetName, dataRef);
        }
      }
    };
  }

  static async read(data: Uint8Array | Buffer): Promise<any> {
    const uint8Array = data instanceof Buffer ? new Uint8Array(data) : data;
    const reader = new XlsxReader(uint8Array);
    return reader.read();
  }

  static fromJSON(json: any): Xldx {
    const xldx = new Xldx([]);
    
    if (json.sheets) {
      json.sheets.forEach((sheet: any) => {
        xldx.writer.addWorksheet(sheet.name, sheet.data, sheet.columnWidths);
        xldx.worksheets.push({
          name: sheet.name,
          data: sheet.data,
          columnWidths: sheet.columnWidths
        });
      });
    }
    
    return xldx;
  }
}