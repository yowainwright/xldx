import {
  XlsxWriter,
  XlsxReader,
  zipWorkbookFiles,
  zipWorkbookFilesCompressed,
} from "./xlsx/index";
import { Sheet } from "./sheet";
import type {
  CellStyle,
  ColumnDefinition,
  SheetOptions,
  XldxOptions,
  PatternFunction,
} from "./types";
import type { ColorTheme } from "./themes";
import type {
  DataRow,
  SheetsData,
  ColumnData,
  SheetDataAPI,
  SerializedWorkbook,
  SerializedSheet,
  XldxPlugin,
  Relationship,
} from "./types";
import type {
  WorkbookData,
  WorkbookDataWithStyles,
  Worksheet as XlsxWorksheet,
} from "./xlsx/types";
import {
  setTheme,
  zebraBg,
  bgColorBasedOnDiff,
  colorPerDiff,
  txtColorBasedOnDiff,
  createSetWidthBasedOnCharacterCount,
  customizeInput,
} from "./utils";

export * from "./themes";
export * from "./types";
export { Sheet } from "./sheet";

export class Xldx {
  protected data: DataRow[] | SheetsData;
  protected customPatterns: Record<string, PatternFunction>;
  protected currentSheetData: DataRow[] = [];
  protected sheets: Map<string, Sheet> = new Map();
  protected plugins: XldxPlugin[] = [];

  public readonly zebraBg: PatternFunction;
  public readonly bgColorBasedOnDiff: PatternFunction;
  public readonly colorPerDiff: PatternFunction;
  public readonly txtColorBasedOnDiff: PatternFunction;
  public readonly createSetWidthBasedOnCharacterCount =
    createSetWidthBasedOnCharacterCount.bind(this);
  public readonly customizeInput = customizeInput.bind(this);

  constructor(data: DataRow[] | SheetsData, options: XldxOptions = {}) {
    this.data = data;
    this.customPatterns = options.customPatterns || {};

    if (!Array.isArray(data) && "sheets" in data) {
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

  use(plugin: XldxPlugin): this {
    this.plugins.push(plugin);
    return this;
  }

  getPlugins(): readonly XldxPlugin[] {
    return this.plugins;
  }

  createColumn(definition: ColumnDefinition): ColumnDefinition {
    return definition;
  }

  createColumns(definitions: ColumnDefinition[]): ColumnDefinition[] {
    return definitions;
  }

  protected convertColumnDataToRows(columnData: ColumnData): DataRow[] {
    const columns = Object.keys(columnData);
    const hasNoColumns = columns.length === 0;
    if (hasNoColumns) return [];

    const rowCount = Math.max(...columns.map((col) => columnData[col].length));

    return Array.from({ length: rowCount }, (_, i) =>
      columns.reduce(
        (row, col) => ({
          ...row,
          [col]: columnData[col][i] ?? null,
        }),
        {} as DataRow,
      ),
    );
  }

  protected buildSheetsFromData(): void {
    const isNotMultiSheet =
      Array.isArray(this.data) || !("sheets" in this.data);
    if (isNotMultiSheet) return;

    const sheetsData = this.data as SheetsData;
    sheetsData.sheets.map((sheet) => {
      const rows = this.convertColumnDataToRows(sheet.data);
      const columnKeys = Object.keys(sheet.data);
      const columns: ColumnDefinition[] = columnKeys.map((key) => ({
        key,
        header: key,
        width: "auto",
      }));

      this.currentSheetData = rows;
      return this.createSheet({ name: sheet.name }, ...columns);
    });
  }

  createSheet(options: SheetOptions, ...columns: ColumnDefinition[]): this {
    const isSingleSheetData = Array.isArray(this.data);
    if (isSingleSheetData) {
      this.currentSheetData = this.data as DataRow[];
    }

    const sheet = new Sheet(
      this.currentSheetData,
      columns,
      options,
      this.customPatterns,
    );

    this.sheets.set(options.name, sheet);

    return this;
  }

  createSheets(
    sheets: Array<{ options: SheetOptions; columns: ColumnDefinition[] }>,
  ): this {
    sheets.map(({ options, columns }) => this.createSheet(options, ...columns));
    return this;
  }

  protected buildWriter(): XlsxWriter {
    const writer = new XlsxWriter();

    Array.from(this.sheets.entries()).forEach(([name, sheet]) => {
      const worksheetData = sheet.toWorksheetData();
      writer.addWorksheet(
        name,
        worksheetData.data,
        worksheetData.columnWidths,
        {
          rowHeights: worksheetData.rowHeights,
          frozen: worksheetData.frozen,
        },
      );
    });

    return writer;
  }

  protected collectPluginContentTypes(): readonly string[] {
    return this.plugins.flatMap((plugin) => [
      ...(plugin.getContentTypes?.() || []),
    ]);
  }

  protected collectPluginRelationships(): readonly Relationship[] {
    return this.plugins.flatMap((plugin) => [
      ...(plugin.getRelationships?.() || []),
    ]);
  }

  protected generateFiles(): Map<string, string | Uint8Array> {
    const writer = this.buildWriter();
    const extraFiles = new Map<string, string | Uint8Array>();
    const context = {
      worksheets: writer.getWorksheets() as readonly XlsxWorksheet[],
      addFile: (path: string, content: string | Uint8Array) => {
        extraFiles.set(path, content);
      },
      getFile: (path: string) => extraFiles.get(path),
    };

    this.plugins.forEach((plugin) => plugin.beforeGenerate?.(context));

    const files = writer.generateFiles({
      contentTypes: this.collectPluginContentTypes(),
      relationships: this.collectPluginRelationships(),
    });
    extraFiles.forEach((content, path) => files.set(path, content));
    this.plugins.forEach((plugin) => plugin.afterGenerate?.(files));

    return files;
  }

  async toUint8Array(): Promise<Uint8Array> {
    return zipWorkbookFiles(this.generateFiles());
  }

  async toUint8ArrayCompressed(): Promise<Uint8Array> {
    return zipWorkbookFilesCompressed(this.generateFiles());
  }

  toJSON(): SerializedWorkbook {
    const sheets: SerializedSheet[] = Array.from(this.sheets.entries()).map(
      ([name, sheet]) => {
        const worksheetData = sheet.toWorksheetData();
        return {
          name,
          data: worksheetData.data,
          columnWidths: worksheetData.columnWidths,
          rows: sheet.getRowsData(),
          columns: sheet.getColumns(),
          options: sheet.getOptions(),
        };
      },
    );

    return { sheets };
  }

  getSheetData(sheet: string | number): SheetDataAPI {
    let sheetInstance: Sheet | undefined;

    const isStringIdentifier = typeof sheet === "string";
    if (isStringIdentifier) {
      sheetInstance = this.sheets.get(sheet);
    } else {
      const sheetNames = Array.from(this.sheets.keys());
      const hasSheetAtIndex = sheet >= 0 && sheet < sheetNames.length;
      if (hasSheetAtIndex) {
        sheetInstance = this.sheets.get(sheetNames[sheet]);
      }
    }

    if (!sheetInstance) {
      throw new Error(
        typeof sheet === "number"
          ? `Sheet at index ${sheet} not found`
          : `Sheet ${sheet} not found`,
      );
    }

    const instance = sheetInstance;
    return {
      getRowsData: () => instance.getRowsData(),
      getColumnData: () => instance.getColumnData(),
      getRowStyles: (rowIndex?: number) => instance.getRowStyles(rowIndex),
      getColumnStyles: (columnKey?: string) =>
        instance.getColumnStyles(columnKey),
      updateRowStyles: (rowIndex: number, styles: CellStyle) =>
        instance.updateRowStyles(rowIndex, styles),
      updateColumnStyles: (columnKey: string, styles: CellStyle) =>
        instance.updateColumnStyles(columnKey, styles),
      updateRowData: (rowIndex: number, data: DataRow) =>
        instance.updateRowData(rowIndex, data),
      updateColumnData: (columnKey: string, data: unknown[]) =>
        instance.updateColumnData(columnKey, data),
    };
  }

  static async read(data: Uint8Array | Buffer): Promise<WorkbookData> {
    const uint8Array = data instanceof Buffer ? new Uint8Array(data) : data;
    const reader = new XlsxReader(uint8Array);
    return reader.readAsync();
  }

  static readWithStyles(data: Uint8Array | Buffer): WorkbookDataWithStyles {
    const uint8Array = data instanceof Buffer ? new Uint8Array(data) : data;
    const reader = new XlsxReader(uint8Array);
    return reader.readWithStyles();
  }

  static async readWithStylesAsync(
    data: Uint8Array | Buffer,
  ): Promise<WorkbookDataWithStyles> {
    const uint8Array = data instanceof Buffer ? new Uint8Array(data) : data;
    const reader = new XlsxReader(uint8Array);
    return reader.readWithStylesAsync();
  }

  static fromJSON(json: Partial<SerializedWorkbook>): Xldx {
    const xldx = new Xldx([]);

    if (json.sheets) {
      json.sheets.forEach((sheet) => {
        const columns =
          sheet.columns ||
          (sheet.data[0] || []).map((header, index) => ({
            key: String(header ?? `Column${index + 1}`),
            header: String(header ?? `Column ${index + 1}`),
            width: sheet.columnWidths?.[index],
          }));
        const rows =
          sheet.rows ||
          sheet.data.slice(1).map((row) =>
            columns.reduce(
              (data, column, index) => ({
                ...data,
                [column.key]: row[index] ?? null,
              }),
              {} as DataRow,
            ),
          );
        const options = sheet.options || { name: sheet.name };

        xldx.sheets.set(
          sheet.name,
          new Sheet(rows, columns, { ...options, name: sheet.name }),
        );
      });
    }

    return xldx;
  }
}
