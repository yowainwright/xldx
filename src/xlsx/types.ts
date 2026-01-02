export type BorderStyle =
  | "thin"
  | "medium"
  | "thick"
  | "dashed"
  | "dotted"
  | "double";

export interface BorderSide {
  readonly style?: BorderStyle;
  readonly color?: string;
}

export interface CellBorder {
  readonly top?: BorderSide;
  readonly bottom?: BorderSide;
  readonly left?: BorderSide;
  readonly right?: BorderSide;
}

export interface CellStyle {
  readonly font?: {
    readonly bold?: boolean;
    readonly italic?: boolean;
    readonly size?: number;
    readonly color?: string;
  };
  readonly fill?: {
    readonly color?: string;
  };
  readonly alignment?: {
    readonly horizontal?: "left" | "center" | "right";
    readonly vertical?: "top" | "middle" | "bottom";
  };
  readonly border?: CellBorder;
  readonly numberFormat?: string;
}

export interface Cell {
  readonly value: string | number | boolean | Date | null;
  readonly formula?: string;
  readonly style?: CellStyle;
}

export type CellValue = Cell | string | number | boolean | null;

export interface MergeCell {
  readonly start: { readonly row: number; readonly col: number };
  readonly end: { readonly row: number; readonly col: number };
}

export interface FrozenPane {
  readonly rows?: number;
  readonly cols?: number;
}

export interface Worksheet {
  readonly name: string;
  readonly data: readonly (readonly CellValue[])[];
  readonly columnWidths?: readonly number[];
  readonly rowHeights?: readonly (number | undefined)[];
  readonly mergedCells?: readonly MergeCell[];
  readonly frozen?: FrozenPane;
}

export interface CellResult {
  readonly type: string;
  readonly value: string;
}

export interface ParsedCell {
  readonly value: unknown;
  readonly style?: CellStyle;
  readonly formula?: string;
}

export interface ParsedSheet {
  readonly name: string;
  readonly data: readonly (readonly unknown[])[];
  readonly columnWidths?: readonly number[];
  readonly rowHeights?: readonly (number | undefined)[];
}

export interface ParsedSheetWithStyles {
  readonly name: string;
  readonly data: readonly (readonly ParsedCell[])[];
  readonly columnWidths?: readonly number[];
  readonly rowHeights?: readonly (number | undefined)[];
}

export interface WorkbookData {
  readonly sheets: readonly ParsedSheet[];
}

export interface WorkbookDataWithStyles {
  readonly sheets: readonly ParsedSheetWithStyles[];
}

export interface ParsedFont {
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly size?: number;
  readonly color?: string;
  readonly name?: string;
}

export interface ParsedFill {
  readonly color?: string;
  readonly pattern?: string;
}

export interface ParsedBorder {
  readonly top?: BorderSide;
  readonly bottom?: BorderSide;
  readonly left?: BorderSide;
  readonly right?: BorderSide;
}

export interface ParsedAlignment {
  readonly horizontal?: "left" | "center" | "right";
  readonly vertical?: "top" | "middle" | "bottom";
  readonly wrapText?: boolean;
}

export interface CellXf {
  readonly fontId?: number;
  readonly fillId?: number;
  readonly borderId?: number;
  readonly numFmtId?: number;
  readonly applyFont?: boolean;
  readonly applyFill?: boolean;
  readonly applyBorder?: boolean;
  readonly applyAlignment?: boolean;
  readonly alignment?: ParsedAlignment;
}

export interface ParsedStyles {
  readonly fonts: readonly ParsedFont[];
  readonly fills: readonly ParsedFill[];
  readonly borders: readonly ParsedBorder[];
  readonly cellXfs: readonly CellXf[];
  readonly numFmts: ReadonlyMap<number, string>;
}
