import type { Cell, CellValue, CellResult } from "./types";
import { EXCEL_EPOCH_MS, MS_PER_DAY, EXCEL_DATE_OFFSET } from "./constants";

const XML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

const XML_ESCAPE_REGEX = /[&<>"']/g;

export function escapeXml(str: string): string {
  return str.replace(XML_ESCAPE_REGEX, (char) => XML_ESCAPE_MAP[char]);
}

export function unescapeXml(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function isCellObject(value: CellValue): value is Cell {
  return (
    typeof value === "object" &&
    value !== null &&
    ("value" in value || "formula" in value)
  );
}

export function extractCellValue(
  cell: CellValue,
): string | number | boolean | Date | null {
  const isCellWithValue = isCellObject(cell);
  return isCellWithValue ? cell.value : cell;
}

export function extractFormula(cell: CellValue): string | undefined {
  const isCellWithFormula = isCellObject(cell);
  return isCellWithFormula ? cell.formula : undefined;
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

/**
 * Converts a JavaScript Date to an Excel serial date number.
 *
 * Excel uses a serial date system where:
 *   - 1 = January 1, 1900
 *   - 2 = January 2, 1900
 *   - etc.
 *
 * Note: Excel incorrectly treats 1900 as a leap year (the "Lotus 1-2-3 bug"),
 * so dates after February 28, 1900 need an offset of 2 instead of 1.
 *
 * @see https://docs.microsoft.com/en-us/office/troubleshoot/excel/1900-702-702-702-702-702-702
 * @param date - The JavaScript Date to convert
 * @returns The Excel serial date number
 */
export function dateToExcelSerial(date: Date): number {
  const daysSinceEpoch = Math.floor(
    (date.getTime() - EXCEL_EPOCH_MS) / MS_PER_DAY,
  );
  return daysSinceEpoch + EXCEL_DATE_OFFSET;
}

export function getCellResult(cell: CellValue): CellResult {
  const actualValue = extractCellValue(cell);

  const isEmpty = isNullOrUndefined(actualValue);
  if (isEmpty) return { type: "", value: "" };

  const isBool = isBoolean(actualValue);
  if (isBool) return { type: "b", value: actualValue ? "1" : "0" };

  const isNum = isNumber(actualValue);
  if (isNum) return { type: "n", value: String(actualValue) };

  const isDateValue = isDate(actualValue);
  if (isDateValue)
    return { type: "n", value: String(dateToExcelSerial(actualValue)) };

  const stringValue = String(actualValue);
  const isEmptyString = stringValue === "";
  if (isEmptyString) return { type: "", value: "" };

  return { type: "s", value: stringValue };
}

/**
 * Converts Excel column letters to a zero-based column index.
 *
 * Excel columns use base-26 notation with A=1, B=2, ..., Z=26, AA=27, etc.
 *
 * @param letters - The column letters (e.g., 'A', 'BC', 'XFD')
 * @returns Zero-based column index
 */
export function lettersToColumnIndex(letters: string): number {
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return col - 1;
}

export function parseNumericValue(value: string): number | string {
  const num = parseFloat(value);
  const isValidNumber = !isNaN(num);
  return isValidNumber ? num : value;
}
