import { MiniZip, MiniUnzip } from "../zip/index.js";
import type { CellValue, Worksheet, EncodedCell } from "./types.js";
import type { Workbook } from "../types.js";
import { readCellValue } from "../utils.js";
import { ARRAY_METADATA_XML, EMPTY_CELL, STYLES_XML } from "./constants.js";
import {
  cellAddress,
  excelFormula,
  isFormulaError,
  normalizeFormula,
  normalizeResult,
  parseAddress,
} from "../formula/utils.js";
import type { FormulaValue, FormulaResult, SpillRange } from "../formula/types.js";

export class XlsxWriter {
  private worksheets: Worksheet[] = [];
  private sharedStrings: string[] = [];
  private stringMap: Map<string, number> = new Map();

  addWorksheet(
    name: string,
    data: unknown[][],
    columnWidths?: number[],
    spills?: SpillRange[],
  ): void {
    const cells = data.map((row) => row.slice());
    this.worksheets[this.worksheets.length] = { name, data: cells, columnWidths, spills };
  }

  private addSharedString(str: string): number {
    const existing = this.stringMap.get(str);
    if (existing !== undefined) return existing;
    const index = this.sharedStrings.length;
    this.sharedStrings[index] = str;
    this.stringMap.set(str, index);
    return index;
  }

  private getCellValue(cell: unknown): EncodedCell {
    const hasCell = cell !== null && cell !== undefined;
    if (!hasCell) return EMPTY_CELL;
    const value = readCellValue(cell);
    const objectValue = typeof value === "object" && value !== null;
    const errorCell = objectValue && "error" in value;
    if (errorCell) {
      const result = normalizeResult(value);
      const encoded = this.encodeFormulaResult(result);
      return encoded;
    }
    const encoded = this.encodeValue(value);
    return encoded;
  }

  private encodeValue(value: unknown): EncodedCell {
    const isEmpty = value === null || value === undefined;
    if (isEmpty) return EMPTY_CELL;
    const isNumber = typeof value === "number";
    if (isNumber) {
      const encoded = this.encodeNumber(value);
      return encoded;
    }
    const isBoolean = typeof value === "boolean";
    const type = isBoolean ? "b" : "s";
    const index = isBoolean ? undefined : this.addSharedString(String(value));
    const content = isBoolean ? String(Number(value)) : String(index);
    const encoded = { type, value: content };
    return encoded;
  }

  private encodeNumber(value: number): EncodedCell {
    const content = String(value);
    const encoded = { type: "n", value: content };
    return encoded;
  }

  private columnToLetters(col: number): string {
    let letters = "";
    col++;
    while (col > 0) {
      col--;
      letters = String.fromCharCode(65 + (col % 26)) + letters;
      col = Math.floor(col / 26);
    }
    return letters;
  }

  private generateContentTypes(): string {
    const metadata = this.hasArrays()
      ? '<Override PartName="/xl/metadata.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheetMetadata+xml"/>'
      : "";
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${this.worksheets
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("\n  ")}
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
${metadata}</Types>`;
    return xml;
  }

  private generateRels(): string {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
    return xml;
  }

  private generateWorkbook(): string {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${this.worksheets
      .map(
        (sheet, i) =>
          `<sheet name="${this.escapeXml(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
      )
      .join("\n    ")}
  </sheets>
</workbook>`;
    return xml;
  }

  private generateWorkbookRels(): string {
    const metadata = this.hasArrays()
      ? `<Relationship Id="rId${this.worksheets.length + 3}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sheetMetadata" Target="metadata.xml"/>`
      : "";
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${this.worksheets
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
    )
    .join("\n  ")}
  <Relationship Id="rId${this.worksheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId${this.worksheets.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
${metadata}</Relationships>`;
    return xml;
  }

  private generateWorksheet(sheet: Worksheet): string {
    const cols = this.generateColumns(sheet.columnWidths);
    const serialized = sheet.data.map((row, index) => this.generateRow(row, index, sheet.spills));
    const rows = serialized.filter(Boolean).join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}
  <sheetData>
${rows}
  </sheetData>
</worksheet>`;
    return xml;
  }

  private generateColumns(widths?: number[]): string {
    if (!widths) return "";
    const columns = widths.map((width, index) => {
      const number = index + 1;
      const xml = `<col min="${number}" max="${number}" width="${width}" customWidth="1"/>`;
      return xml;
    });
    const xml = `\n  <cols>\n    ${columns.join("\n    ")}\n  </cols>`;
    return xml;
  }

  private generateRow(row: unknown[], rowIndex: number, spills: SpillRange[] = []): string {
    const serialized = row.map((cell, index) => this.generateCell(cell, rowIndex, index, spills));
    const cells = serialized.filter(Boolean).join("\n");
    if (!cells) return "";
    const xml = `    <row r="${rowIndex + 1}">\n${cells}\n    </row>`;
    return xml;
  }

  private generateCell(
    cell: unknown,
    rowIndex: number,
    columnIndex: number,
    spills: SpillRange[],
  ): string {
    const cellRef = `${this.columnToLetters(columnIndex)}${rowIndex + 1}`;
    const formula = normalizeFormula(cell);
    if (formula) {
      const spill = spills.find((range) => range.row === rowIndex && range.column === columnIndex);
      const xml = this.generateFormulaCell(cellRef, formula, spill);
      return xml;
    }
    const { type, value } = this.getCellValue(cell);
    if (!value) return "";
    const typeAttr = type ? ` t="${type}"` : "";
    const xml = `      <c r="${cellRef}"${typeAttr}>\n        <v>${value}</v>\n      </c>`;
    return xml;
  }

  private generateFormulaCell(reference: string, cell: FormulaValue, spill?: SpillRange): string {
    const source = excelFormula(cell.formula, true);
    const expression = this.escapeXml(source);
    const formulaAttributes = this.arrayAttributes(reference, spill);
    const metadata = spill ? ' cm="1"' : "";
    if (!("result" in cell)) {
      const xml = `<c r="${reference}"${metadata}><f${formulaAttributes}>${expression}</f></c>`;
      return xml;
    }
    const { type, value } = this.encodeFormulaResult(cell.result);
    const escaped = this.escapeXml(value);
    const xml = `<c r="${reference}" t="${type}"${metadata}><f${formulaAttributes}>${expression}</f><v>${escaped}</v></c>`;
    return xml;
  }

  private arrayAttributes(reference: string, spill?: SpillRange): string {
    if (!spill) return "";
    const end = cellAddress(spill.row + spill.rows - 1, spill.column + spill.columns - 1);
    const attributes = ` t="array" ref="${reference}:${end}"`;
    return attributes;
  }

  private encodeFormulaResult(result: FormulaResult | undefined): EncodedCell {
    if (result === undefined) throw new TypeError("Invalid formula result");
    if (typeof result === "object") {
      const { error: value } = result;
      const encoded = { type: "e", value };
      return encoded;
    }
    if (typeof result === "boolean") {
      const value = String(Number(result));
      const encoded = { type: "b", value };
      return encoded;
    }
    const type = typeof result === "number" ? "n" : "str";
    const value = String(result);
    const encoded = { type, value };
    return encoded;
  }

  private generateSharedStrings(): string {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${this.sharedStrings.length}" uniqueCount="${this.sharedStrings.length}">
  ${this.sharedStrings.map((str) => `<si><t>${this.escapeXml(str)}</t></si>`).join("\n  ")}
</sst>`;
    return xml;
  }

  private escapeXml(str: string): string {
    const escaped = str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
    return escaped;
  }

  generate(): Uint8Array<ArrayBuffer> {
    const zip = new MiniZip();

    const worksheetXml = this.worksheets.map((sheet) => this.generateWorksheet(sheet));

    zip.addFile("[Content_Types].xml", this.generateContentTypes());
    zip.addFile("_rels/.rels", this.generateRels());
    zip.addFile("xl/workbook.xml", this.generateWorkbook());
    zip.addFile("xl/_rels/workbook.xml.rels", this.generateWorkbookRels());
    zip.addFile("xl/styles.xml", STYLES_XML);
    if (this.hasArrays()) zip.addFile("xl/metadata.xml", ARRAY_METADATA_XML);
    zip.addFile("xl/sharedStrings.xml", this.generateSharedStrings());

    worksheetXml.forEach((xml, i) => {
      zip.addFile(`xl/worksheets/sheet${i + 1}.xml`, xml);
    });

    const data = zip.generate();
    return data;
  }

  private hasArrays(): boolean {
    const arrays = this.worksheets.some((sheet) => Boolean(sheet.spills?.length));
    return arrays;
  }
}

export class XlsxReader {
  private zip: MiniUnzip;
  private spills: SpillRange[] = [];

  constructor(data: Uint8Array) {
    this.zip = new MiniUnzip(data);
  }

  private parseSharedStrings(): string[] {
    const content = this.zip.getFile("xl/sharedStrings.xml");
    const empty: string[] = [];
    if (!content) return empty;
    const matches = content.matchAll(/<t[^>]*>(.*?)<\/t>/g);
    const strings = Array.from(matches, (match) => this.unescapeXml(match[1]));
    return strings;
  }

  private unescapeXml(str: string): string {
    const unescaped = str
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
    return unescaped;
  }

  private parseWorksheetNames(): string[] {
    const content = this.zip.getFile("xl/workbook.xml");
    const empty: string[] = [];
    if (!content) return empty;
    const matches = content.matchAll(/<sheet[^>]*name="([^"]*)"[^>]*>/g);
    const names = Array.from(matches, (match) => this.unescapeXml(match[1]));
    return names;
  }

  private parseWorksheet(sheetIndex: number, sharedStrings: string[]): CellValue[][] {
    this.spills = [];
    const content = this.zip.getFile(`xl/worksheets/sheet${sheetIndex + 1}.xml`);
    const rows: CellValue[][] = [];
    if (!content) return rows;
    const rowRegex = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
    for (const rowMatch of content.matchAll(rowRegex)) {
      const rowNum = parseInt(rowMatch[1]) - 1;
      rows[rowNum] = this.parseRow(rowMatch[2], sharedStrings);
    }
    return rows;
  }

  private parseRow(content: string, sharedStrings: string[]): CellValue[] {
    const row: CellValue[] = [];
    const regex = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    for (const match of content.matchAll(regex)) {
      const address = /\br="([A-Z]+)\d+"/.exec(match[1]);
      if (!address) continue;
      const index = this.lettersToColumn(address[1]);
      const type = /\bt="([^"]*)"/.exec(match[1])?.[1] ?? "n";
      row[index] = this.parseCell(type, match[2] ?? "", sharedStrings, match[1]);
    }
    return row;
  }

  private parseCell(
    type: string,
    content: string,
    sharedStrings: string[],
    attributes: string,
  ): CellValue {
    const expression = /<f\b([^>]*?)(?:\/>|>([\s\S]*?)<\/f>)/.exec(content);
    const cached = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>|<v\s*\/>/.exec(content);
    const value = cached?.[1] ?? "";
    if (!expression) {
      if (!cached) return undefined;
      const decoded = this.decodeCell(type, value, sharedStrings);
      return decoded;
    }
    const formula = this.readFormula(expression, attributes);
    const result = cached ? this.decodeCell(type, value, sharedStrings) : undefined;
    const source = cached ? { formula, result } : { formula };
    const cell = normalizeFormula(source);
    return cell;
  }

  private readFormula(expression: string[], attributes: string): string {
    const encoding = /\bt="([^"]*)"/.exec(expression[1])?.[1] ?? "normal";
    if (encoding === "array") this.readArray(expression[1], attributes);
    else if (encoding !== "normal") throw new Error(`Unsupported formula encoding: ${encoding}`);
    const source = this.unescapeXml(expression[2] ?? "");
    const formula = excelFormula(source, false);
    return formula;
  }

  private readArray(formula: string, attributes: string): void {
    const metadata = this.zip.getFile("xl/metadata.xml");
    const dynamic = /\bcm="1"/.test(attributes) && metadata?.includes('name="XLDAPR"');
    const reference = /\bref="([^"]+)"/.exec(formula)?.[1];
    const unsupported = !dynamic || !reference;
    if (unsupported) throw new Error("Unsupported formula encoding: array");
    const [first, last = first] = reference.split(":");
    const { row, column } = parseAddress(first);
    const end = parseAddress(last);
    const rows = end.row - row + 1;
    const columns = end.column - column + 1;
    const reversed = rows < 1 || columns < 1;
    if (reversed) throw new Error("Invalid array formula range");
    this.spills[this.spills.length] = { row, column, rows, columns };
  }

  private decodeCell(type: string, value: string, sharedStrings: string[]) {
    if (type === "e") {
      const error = this.decodeError(value);
      return error;
    }
    if (type === "s") {
      const text = sharedStrings[parseInt(value)] || "";
      return text;
    }
    if (type === "b") {
      const boolean = value === "1";
      return boolean;
    }
    if (type === "str") {
      const text = this.unescapeXml(value);
      return text;
    }
    const parsed = this.decodeNumber(value);
    return parsed;
  }

  private decodeNumber(value: string): string | number {
    const number = parseFloat(value);
    const parsed = isNaN(number) ? value : number;
    return parsed;
  }

  private decodeError(value: string): FormulaResult {
    if (!isFormulaError(value)) throw new TypeError(`Invalid formula error: ${value}`);
    const error = { error: value };
    return error;
  }

  private lettersToColumn(letters: string): number {
    let col = 0;
    for (let i = 0; i < letters.length; i++) {
      col = col * 26 + (letters.charCodeAt(i) - 64);
    }
    const index = col - 1;
    return index;
  }

  read(): Workbook {
    const sharedStrings = this.parseSharedStrings();
    const sheetNames = this.parseWorksheetNames();

    const sheets = sheetNames.map((name, i) => {
      const data = this.parseWorksheet(i, sharedStrings);
      const { spills } = this;
      const metadata = spills.length ? { spills } : {};
      const sheet: Worksheet = { name, data, ...metadata };
      return sheet;
    });
    const workbook = { sheets };
    return workbook;
  }
}
