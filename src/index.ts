import { XlsxWriter, XlsxReader } from "./xlsx/index.js";
import { Sheet } from "./sheet/index.js";
import { calculateWorkbook } from "./formula/calculate/index.js";
import type { Calculation } from "./formula/types.js";
import type {
  ColumnDefinition,
  SheetOptions,
  XldxOptions,
  PatternFunction,
} from "./schemas/index.js";
import type { ColorTheme } from "./themes/index.js";
import type { DataRow, SheetsData, ColumnData, SheetDataAPI, Workbook } from "./types.js";
import {
  setTheme,
  zebraBg,
  bgColorBasedOnDiff,
  colorPerDiff,
  txtColorBasedOnDiff,
  createSetWidthBasedOnCharacterCount,
  customizeInput,
} from "./utils.js";

export * from "./schemas/index.js";
export * from "./themes/index.js";
export * from "./types.js";
export { Sheet } from "./sheet/index.js";
export { Formula } from "./formula/index.js";
export type {
  FormulaError,
  FormulaResult,
  FormulaValue,
  FormulaIssue,
  Calculation,
} from "./formula/types.js";

export class Xldx {
  protected data: DataRow[] | SheetsData;
  protected customPatterns: Record<string, PatternFunction>;
  protected currentSheetData: DataRow[] = [];
  protected sheets: Map<string, Sheet> = new Map();

  public readonly zebraBg: PatternFunction;
  public readonly bgColorBasedOnDiff: PatternFunction;
  public readonly colorPerDiff: PatternFunction;
  public readonly txtColorBasedOnDiff: PatternFunction;
  public readonly createSetWidthBasedOnCharacterCount = createSetWidthBasedOnCharacterCount;
  public readonly customizeInput = customizeInput;

  constructor(data: DataRow[] | SheetsData, options: XldxOptions = {}) {
    this.data = data;
    this.customPatterns = options.customPatterns || {};

    const isMultiSheet = !Array.isArray(data) && "sheets" in data;
    if (isMultiSheet) {
      this.buildSheetsFromData();
    }

    this.zebraBg = zebraBg;
    this.bgColorBasedOnDiff = bgColorBasedOnDiff;
    this.colorPerDiff = colorPerDiff;
    this.txtColorBasedOnDiff = txtColorBasedOnDiff;
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

  protected convertColumnDataToRows(columnData: ColumnData): DataRow[] {
    const columns = Object.keys(columnData);
    const hasColumns = columns.length > 0;
    const empty: DataRow[] = [];
    if (!hasColumns) return empty;

    const rowCount = Math.max(...columns.map((col) => columnData[col].length));

    const rows = Array.from({ length: rowCount }, (_, index) => {
      const entries = columns.map((key) => [key, columnData[key][index] ?? null]);
      const row: DataRow = Object.fromEntries(entries);
      return row;
    });
    return rows;
  }

  protected buildSheetsFromData(): void {
    const { data } = this;
    const isMultiSheet = !Array.isArray(data) && "sheets" in data;
    if (!isMultiSheet) return;

    data.sheets.forEach((sheet) => {
      const rows = this.convertColumnDataToRows(sheet.data);
      const columnKeys = Object.keys(sheet.data);
      const columns = this.createAutoColumns(columnKeys);

      this.currentSheetData = rows;
      const { name } = sheet;
      this.createSheet({ name }, ...columns);
    });
  }

  protected createAutoColumns(keys: string[]): ColumnDefinition[] {
    const columns: ColumnDefinition[] = keys.map((key) => ({ key, header: key, width: "auto" }));
    return columns;
  }

  createSheet(options: SheetOptions, ...columns: ColumnDefinition[]): this {
    const { data } = this;
    const isSingleSheetData = Array.isArray(data);
    if (isSingleSheetData) {
      this.currentSheetData = data;
    }

    const sheet = new Sheet(this.currentSheetData, columns, options, this.customPatterns);

    this.sheets.set(options.name, sheet);

    return this;
  }

  createSheets(sheets: Array<{ options: SheetOptions; columns: ColumnDefinition[] }>): this {
    sheets.forEach(({ options, columns }) => this.createSheet(options, ...columns));
    return this;
  }

  async toUint8Array(): Promise<Uint8Array<ArrayBuffer>> {
    const writer = new XlsxWriter();
    const { sheets } = this.calculate().workbook;
    sheets.forEach((sheet) => {
      writer.addWorksheet(sheet.name, sheet.data, sheet.columnWidths);
    });
    const data = writer.generate();
    return data;
  }

  calculate(): Calculation {
    const result = calculateWorkbook(this.toJSON());
    return result;
  }

  toJSON(): Workbook {
    const worksheets = Array.from(this.sheets.entries()).map(([name, sheet]) => {
      const { data, columnWidths } = sheet.toWorksheetData();
      const worksheet = { name, data, columnWidths };
      return worksheet;
    });

    const workbook = { sheets: worksheets };
    return workbook;
  }

  getSheetData(sheet: string | number): SheetDataAPI {
    const instance = this.findSheet(sheet);
    if (!instance) {
      const isIndex = typeof sheet === "number";
      const message = isIndex ? `Sheet at index ${sheet} not found` : `Sheet ${sheet} not found`;
      throw new Error(message);
    }
    const api = this.createSheetAPI(instance);
    return api;
  }

  protected findSheet(sheet: string | number): Sheet | undefined {
    const isName = typeof sheet === "string";
    if (isName) {
      const instance = this.sheets.get(sheet);
      return instance;
    }
    const names = Array.from(this.sheets.keys());
    const hasSheet = sheet >= 0 && sheet < names.length;
    if (!hasSheet) return undefined;
    const instance = this.sheets.get(names[sheet]);
    return instance;
  }

  protected createSheetAPI(instance: Sheet): SheetDataAPI {
    const getRowsData = instance.getRowsData.bind(instance);
    const getColumnData = instance.getColumnData.bind(instance);
    const getRowStyles = instance.getRowStyles.bind(instance);
    const getColumnStyles = instance.getColumnStyles.bind(instance);
    const updateRowStyles = instance.updateRowStyles.bind(instance);
    const updateColumnStyles = instance.updateColumnStyles.bind(instance);
    const updateRowData = instance.updateRowData.bind(instance);
    const updateColumnData = instance.updateColumnData.bind(instance);
    const updateCellData = instance.updateCellData.bind(instance);
    const read = { getRowsData, getColumnData, getRowStyles, getColumnStyles };
    const styles = { updateRowStyles, updateColumnStyles };
    const write = { updateRowData, updateColumnData, updateCellData };
    const api = Object.assign(read, styles, write);
    return api;
  }

  static async read(data: Uint8Array): Promise<Workbook> {
    const reader = new XlsxReader(data);
    const workbook = reader.read();
    return workbook;
  }

  static fromJSON(json: Partial<Workbook>): Xldx {
    const xldx = new Xldx([]);

    if (json.sheets) {
      json.sheets.forEach((sheet) => {
        const restored = Sheet.fromWorksheet(sheet);
        xldx.sheets.set(sheet.name, restored);
      });
    }

    return xldx;
  }
}
