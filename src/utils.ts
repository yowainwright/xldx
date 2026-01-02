import type {
  PatternContext,
  PatternFunction,
  CellStyle,
  ColumnDefinition,
} from "./schemas";
import type { ColorTheme } from "./themes";
import type {
  WidthCalculationOptions,
  TextMatch,
  WidthResult,
  DataRow,
  CellProcessingParams,
  WorksheetView,
} from "./types";
import { defaultTheme } from "./themes";

let currentTheme: ColorTheme = defaultTheme;

export function setTheme(theme: ColorTheme) {
  currentTheme = theme;
}

export const zebraBg: PatternFunction = (context: PatternContext) => {
  const isOddRow = context.rowIndex % 2 !== 0;
  if (isOddRow) return null;

  return {
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: currentTheme.base[100],
    },
  };
};

export const bgColorBasedOnDiff: PatternFunction = (
  context: PatternContext,
) => {
  const baseColors = [
    currentTheme.base[100],
    currentTheme.base[200],
    currentTheme.base[300],
    currentTheme.base[400],
    currentTheme.base[500],
  ];

  const uniqueValues = context.allData
    .map((row) => row[context.columnKey])
    .filter(
      (value, index, self) =>
        value !== undefined && value !== null && self.indexOf(value) === index,
    );

  const colorMap = new Map(
    uniqueValues.map((value, index) => [
      value,
      baseColors[index % baseColors.length],
    ]),
  );

  const color = colorMap.get(context.value);
  const hasNoColor = !color;
  if (hasNoColor) return null;

  return {
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: color,
    },
  };
};

export const colorPerDiff = bgColorBasedOnDiff;

export const txtColorBasedOnDiff: PatternFunction = (
  context: PatternContext,
) => {
  const hasPreviousValue = context.previousValue !== undefined;
  if (!hasPreviousValue) return null;

  const valueUnchanged = context.previousValue === context.value;
  if (valueUnchanged) return null;

  return {
    font: {
      color: currentTheme.primary,
      bold: true,
    },
  };
};

export function createSetWidthBasedOnCharacterCount(
  columnData: unknown[],
  options: WidthCalculationOptions = {},
) {
  const {
    method = "avg",
    minWidth = 10,
    maxWidth = 100,
    padding = 2,
    wrapText = true,
    sampleSize = 100,
    charWidth = 1.2,
  } = options;

  return (): WidthResult | null => {
    const sampleData = columnData.slice(0, sampleSize);
    const columnValues = sampleData.map((value) => String(value || ""));

    const hasNoValues = columnValues.length === 0;
    if (hasNoValues) return null;

    const lengths = columnValues.map((val) => val.length);
    let calculatedWidth: number;

    const isMaxMethod = method === "max";
    const isMedianMethod = method === "median";

    if (isMaxMethod) {
      calculatedWidth = Math.max(...lengths);
    } else if (isMedianMethod) {
      const sorted = [...lengths].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const isEvenLength = sorted.length % 2 === 0;

      calculatedWidth = isEvenLength
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    } else {
      calculatedWidth =
        lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    }

    const widthWithPadding = calculatedWidth * charWidth + padding;
    const width = Math.min(maxWidth, Math.max(minWidth, widthWithPadding));

    return { width, wrapText };
  };
}

export function customizeInput(match: string | TextMatch) {
  return (context: PatternContext) => {
    const value = String(context.value);

    const isStringMatch = typeof match === "string";
    if (isStringMatch) {
      const matches = value === match;
      if (!matches) return null;

      return {
        font: {
          color: currentTheme.text.primary,
        },
      };
    }

    const isObjectMatch = typeof match === "object" && match !== null;
    if (!isObjectMatch) return null;

    const { fastMatch, pattern, caseSensitive = false } = match as TextMatch;

    const hasFastMatch = fastMatch !== undefined;
    if (hasFastMatch) {
      const comparableValue = caseSensitive ? value : value.toLowerCase();
      const comparableMatch = caseSensitive
        ? fastMatch
        : fastMatch.toLowerCase();
      const matches = comparableValue === comparableMatch;

      if (!matches) return null;
    }

    const hasPattern = pattern !== undefined;
    if (hasPattern) {
      const matches = pattern.test(value);
      if (!matches) return null;
    }

    return {
      font: {
        color: currentTheme.text.primary,
      },
    };
  };
}

export const builtInPatterns = {
  zebra: zebraBg,
  zebraBg,
  bgColorBasedOnDiff,
  colorPerDiff,
  txtColorBasedOnDiff,
};

export function applyPattern(
  pattern: string | PatternFunction | undefined,
  context: PatternContext,
  customPatterns: Record<string, PatternFunction> = {},
): Partial<CellStyle> | null {
  if (!pattern) return null;

  const isFunction = typeof pattern === "function";
  if (isFunction)
    return (pattern as PatternFunction)(context) as Partial<CellStyle> | null;

  const isString = typeof pattern === "string";
  if (!isString) return null;

  const builtIn = builtInPatterns[pattern as keyof typeof builtInPatterns];
  if (builtIn) return builtIn(context);

  const custom = customPatterns[pattern];
  return custom ? custom(context) : null;
}

export function buildWorksheetViews(options: {
  freezePane?: { row: number; column: number };
  showGridLines?: boolean;
  showRowColHeaders?: boolean;
}) {
  const views: WorksheetView[] = [];

  const baseView: WorksheetView = {};

  const hasFreezePane = options.freezePane !== undefined;
  if (hasFreezePane) {
    baseView.state = "frozen";
    baseView.xSplit = options.freezePane!.column;
    baseView.ySplit = options.freezePane!.row;
  }

  const hasGridLinesOption = options.showGridLines !== undefined;
  if (hasGridLinesOption) {
    baseView.showGridLines = options.showGridLines;
  }

  const hasRowColHeadersOption = options.showRowColHeaders !== undefined;
  if (hasRowColHeadersOption) {
    baseView.showRowColHeaders = options.showRowColHeaders;
  }

  const hasViewOptions = Object.keys(baseView).length > 0;
  if (hasViewOptions) {
    views.push(baseView);
  }

  return views.length > 0 ? views : undefined;
}

export function buildPatternContext(params: {
  rowIndex: number;
  colIndex: number;
  rowData: DataRow;
  columnKey: string;
  value: unknown;
  previousRowData?: DataRow;
  allData: DataRow[];
}): PatternContext {
  const actualRowIndex = params.rowIndex + 2;

  return {
    rowIndex: actualRowIndex,
    columnIndex: params.colIndex,
    value: params.value,
    previousValue: params.previousRowData?.[params.columnKey],
    rowData: params.rowData,
    allData: params.allData,
    columnKey: params.columnKey,
  };
}

export function resolveCellStyles(params: {
  column: ColumnDefinition;
  rowIndex: number;
  defaultStyle?: CellStyle;
}): CellStyle | undefined {
  const actualRowIndex = params.rowIndex + 2;

  const hasRowOverride = params.column.rows?.[actualRowIndex];
  if (hasRowOverride) {
    return params.column.rows![actualRowIndex];
  }

  return {
    ...params.defaultStyle,
    ...params.column.style,
  };
}

export function buildCellProcessingData(
  data: DataRow[],
  columns: ColumnDefinition[],
  defaultStyle?: CellStyle,
): CellProcessingParams[] {
  return data.flatMap((rowData, rowIndex) =>
    columns.map((column, columnIndex) => ({
      rowData,
      rowIndex,
      column,
      columnIndex,
      allData: data,
      defaultStyle,
    })),
  );
}

export function processCellData(params: CellProcessingParams) {
  const { rowData, rowIndex, column, columnIndex, allData, defaultStyle } =
    params;

  const cellStyle = resolveCellStyles({
    column,
    rowIndex,
    defaultStyle,
  });

  const context = buildPatternContext({
    rowIndex,
    colIndex: columnIndex,
    rowData,
    columnKey: column.key,
    value: rowData[column.key],
    previousRowData: rowIndex > 0 ? allData[rowIndex - 1] : undefined,
    allData,
  });

  return {
    rowIndex,
    columnIndex,
    cellStyle,
    context,
    patterns: column.patterns,
  };
}
