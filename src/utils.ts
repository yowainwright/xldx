import type { PatternContext, PatternFunction, CellStyle } from "./schemas/index.js";
import type { ColorTheme } from "./themes/index.js";
import type {
  WidthCalculationOptions,
  TextMatch,
  WidthResult,
  PatternContextParams,
  CellStyleParams,
} from "./types.js";
import { defaultTheme } from "./themes/index.js";

let currentTheme: ColorTheme = defaultTheme;

export const builtInPatterns: Record<string, PatternFunction> = {
  zebra: zebraBg,
  zebraBg,
  bgColorBasedOnDiff,
  colorPerDiff: bgColorBasedOnDiff,
  txtColorBasedOnDiff,
};

export { bgColorBasedOnDiff as colorPerDiff };

export function setTheme(theme: ColorTheme) {
  currentTheme = theme;
}

export function readCellValue(cell: unknown): unknown {
  const object = typeof cell === "object" && cell !== null;
  const styled = object && "value" in cell;
  const value = styled ? cell.value : cell;
  if (!(value instanceof Date)) return value;
  const epoch = new Date(1900, 0, 1).getTime();
  const days = (value.getTime() - epoch) / 86400000;
  const serial = Math.floor(days) + 2;
  return serial;
}

export function zebraBg(context: PatternContext): ReturnType<PatternFunction> {
  const isEvenRow = context.rowIndex % 2 === 0;
  if (!isEvenRow) return null;
  const { 100: fgColor } = currentTheme.base;
  const fill: CellStyle["fill"] = { type: "pattern", pattern: "solid", fgColor };
  const style = { fill };
  return style;
}

export function bgColorBasedOnDiff(context: PatternContext): ReturnType<PatternFunction> {
  const values = context.allData.map((row) => row[context.columnKey]);
  const presentValues = values.filter(isColorValue);
  const uniqueValues = Array.from(new Set(presentValues));
  const index = uniqueValues.indexOf(context.value);
  const hasColor = index >= 0;
  if (!hasColor) return null;
  const { base } = currentTheme;
  const baseColors = [base[100], base[200], base[300], base[400], base[500]];
  const fgColor = baseColors[index % baseColors.length];
  if (!fgColor) return null;
  const fill: CellStyle["fill"] = { type: "pattern", pattern: "solid", fgColor };
  const style = { fill };
  return style;
}

export function txtColorBasedOnDiff(context: PatternContext): ReturnType<PatternFunction> {
  const hasPreviousValue = context.previousValue !== undefined;
  if (!hasPreviousValue) return null;

  const valueUnchanged = context.previousValue === context.value;
  if (valueUnchanged) return null;

  const { primary: color } = currentTheme;
  const font = { color, bold: true };
  const style = { font };
  return style;
}

export function createSetWidthBasedOnCharacterCount(
  columnData: unknown[],
  options: WidthCalculationOptions = {},
) {
  const settings = { ...options };
  const calculator = (): WidthResult | null => calculateWidth(columnData, settings);
  return calculator;
}

export function customizeInput(match: string | TextMatch) {
  const pattern = (context: PatternContext) => {
    const value = String(context.value);
    const matches = matchesInput(value, match);
    if (!matches) return null;
    const { primary: color } = currentTheme.text;
    const font = { color };
    const style = { font };
    return style;
  };
  return pattern;
}

export function applyPattern(
  pattern: string | PatternFunction | undefined,
  context: PatternContext,
  customPatterns: Record<string, PatternFunction> = {},
): Partial<CellStyle> | null {
  if (!pattern) return null;

  const isFunction = typeof pattern === "function";
  if (isFunction) {
    const style = pattern(context);
    return style;
  }

  const isString = typeof pattern === "string";
  if (!isString) return null;

  const selected = builtInPatterns[pattern] || customPatterns[pattern];
  const style = selected ? selected(context) : null;
  return style;
}

export function resolveCellStyles(params: CellStyleParams): CellStyle | undefined {
  const actualRowIndex = params.rowIndex + 2;
  const override = params.column.rows?.[actualRowIndex];
  if (override) return override;
  const defaultStyle = params.defaultStyle || {};
  const columnStyle = params.column.style || {};
  const style = { ...defaultStyle, ...columnStyle };
  return style;
}

export function buildPatternContext(params: PatternContextParams): PatternContext {
  const { colIndex: columnIndex, rowData, columnKey, value, allData } = params;
  const rowIndex = params.rowIndex + 2;
  const previousValue = params.previousRowData?.[columnKey];
  const context = { rowIndex, columnIndex, value, previousValue, rowData, allData, columnKey };
  return context;
}

function isColorValue(value: unknown): boolean {
  const isPresent = value !== undefined && value !== null;
  const isValid = isPresent && !Number.isNaN(value);
  return isValid;
}

function calculateWidth(data: unknown[], options: WidthCalculationOptions): WidthResult | null {
  const {
    sampleSize = 100,
    method = "avg",
    minWidth = 10,
    maxWidth = 100,
    padding = 2,
    charWidth = 1.2,
    wrapText = true,
  } = options;
  const sample = data.slice(0, sampleSize);
  const lengths = sample.map((value) => String(value || "").length);
  const hasValues = lengths.length > 0;
  if (!hasValues) return null;
  const calculated = measureWidth(lengths, method);
  const padded = calculated * charWidth + padding;
  const width = Math.min(maxWidth, Math.max(minWidth, padded));
  const result = { width, wrapText };
  return result;
}

function measureWidth(lengths: number[], method: string): number {
  if (method === "max") {
    const maximum = Math.max(...lengths);
    return maximum;
  }
  if (method === "median") {
    const sorted = lengths.toSorted((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const isEven = sorted.length % 2 === 0;
    const median = isEven ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
    return median;
  }
  const sum = lengths.reduce((total, length) => total + length, 0);
  const average = sum / lengths.length;
  return average;
}

function matchesInput(value: string, match: string | TextMatch): boolean {
  const isString = typeof match === "string";
  if (isString) {
    const matches = value === match;
    return matches;
  }
  const isObject = typeof match === "object" && match !== null;
  if (!isObject) return false;
  const { fastMatch, pattern, caseSensitive = false } = match;
  if (fastMatch !== undefined) {
    const actual = caseSensitive ? value : value.toLowerCase();
    const expected = caseSensitive ? fastMatch : fastMatch.toLowerCase();
    if (actual !== expected) return false;
  }
  const matches = pattern === undefined || pattern.test(value);
  return matches;
}
