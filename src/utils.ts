import type { PatternContext, PatternFunction } from "./schemas";
import type { ColorTheme } from "./themes";
import type { WidthCalculationOptions, TextMatch, WidthResult } from "./types";
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

export const bgColorBasedOnDiff: PatternFunction = (context: PatternContext) => {
  const colorMap = new Map<unknown, string>();
  const baseColors = [
    currentTheme.base[100],
    currentTheme.base[200],
    currentTheme.base[300],
    currentTheme.base[400],
    currentTheme.base[500],
  ];
  let colorIndex = 0;
  
  context.allData.forEach((row) => {
    const value = row[context.columnKey];
    const hasValue = value !== undefined && value !== null;
    const isNewValue = !colorMap.has(value);
    
    if (!hasValue || !isNewValue) return;
    
    colorMap.set(value, baseColors[colorIndex % baseColors.length]);
    colorIndex++;
  });
  
  const color = colorMap.get(context.value);
  if (!color) return null;
  
  return {
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: color,
    },
  };
};

export const colorPerDiff = bgColorBasedOnDiff;

export const txtColorBasedOnDiff: PatternFunction = (context: PatternContext) => {
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
  options: WidthCalculationOptions = {}
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
    const columnValues = sampleData.map(value => String(value || ""));
    
    const hasNoValues = columnValues.length === 0;
    if (hasNoValues) return null;
    
    const lengths = columnValues.map(val => val.length);
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
      calculatedWidth = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    }
    
    const widthWithPadding = (calculatedWidth * charWidth) + padding;
    const width = Math.min(maxWidth, Math.max(minWidth, widthWithPadding));
    
    return { width, wrapText };
  };
}

export function customizeInput(
  match: string | TextMatch,
  _replacement: string
): PatternFunction {
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
      const comparableMatch = caseSensitive ? fastMatch : fastMatch.toLowerCase();
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