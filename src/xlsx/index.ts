import { MiniZip, MiniUnzip } from "../zip/index";
import type { Relationship } from "../types";
import type {
  Cell,
  CellValue,
  Worksheet,
  CellResult,
  ParsedSheet,
  ParsedSheetWithStyles,
  WorkbookData,
  WorkbookDataWithStyles,
  MergeCell,
  FrozenPane,
  ParsedStyles,
  ParsedFont,
  ParsedFill,
  ParsedBorder,
  ParsedAlignment,
  CellXf,
  CellStyle,
  BorderSide,
  ParsedCell,
} from "./types";
import {
  XML_DECLARATION,
  CONTENT_TYPES_HEADER,
  CONTENT_TYPES_DEFAULTS,
  WORKBOOK_CONTENT_TYPE,
  WORKSHEET_CONTENT_TYPE,
  STYLES_CONTENT_TYPE,
  SHARED_STRINGS_CONTENT_TYPE,
  RELS_NAMESPACE,
  WORKSHEET_REL_TYPE,
  STYLES_REL_TYPE,
  SHARED_STRINGS_REL_TYPE,
  SPREADSHEET_NAMESPACE,
  RELATIONSHIPS_NAMESPACE,
  ROOT_RELS_XML,
  PARSE_NUM_FMT,
  PARSE_FONTS_SECTION,
  PARSE_FONT,
  PARSE_FILLS_SECTION,
  PARSE_FILL,
  PARSE_BORDERS_SECTION,
  PARSE_BORDER,
  PARSE_CELL_XFS_SECTION,
  PARSE_XF,
  PARSE_COLS_SECTION,
  PARSE_COL,
  PARSE_ROW_WITH_HEIGHT,
  PARSE_ROW,
  PARSE_CELL,
  PARSE_COLOR_RGB,
  PARSE_BOLD,
  PARSE_ITALIC,
  PARSE_FONT_SIZE,
  PARSE_FONT_NAME,
  PARSE_PATTERN_TYPE,
  PARSE_FG_COLOR,
  PARSE_COLOR_ELEMENT,
  PARSE_ALIGNMENT,
  PARSE_HORIZONTAL,
  PARSE_VERTICAL,
  PARSE_WRAP_TEXT,
  PARSE_FONT_ID,
  PARSE_FILL_ID,
  PARSE_BORDER_ID,
  PARSE_NUM_FMT_ID,
  PARSE_APPLY_FONT,
  PARSE_APPLY_FILL,
  PARSE_APPLY_BORDER,
  PARSE_APPLY_ALIGNMENT,
  columnIndexToLetters,
} from "./constants";
import {
  escapeXml,
  unescapeXml,
  getCellResult,
  extractFormula,
  lettersToColumnIndex,
  parseNumericValue,
} from "./utils";

export type {
  Cell,
  CellStyle,
  CellValue,
  Worksheet,
  CellResult,
  ParsedSheet,
  ParsedSheetWithStyles,
  WorkbookData,
  WorkbookDataWithStyles,
  ParsedStyles,
  ParsedFont,
  ParsedFill,
  ParsedBorder,
  ParsedAlignment,
  CellXf,
  ParsedCell,
} from "./types";
export * from "./constants";
export * from "./utils";
export { StreamingXlsxWriter, streamWorksheet, streamRow } from "./stream";
export { generateWorksheetsParallel } from "./worker/index";

export function relationship(id: number, type: string, target: string): string {
  return `<Relationship Id="rId${id}" Type="${type}" Target="${target}"/>`;
}

export function relationshipWithId(rel: Relationship): string {
  return `<Relationship Id="${escapeXml(rel.id)}" Type="${escapeXml(rel.type)}" Target="${escapeXml(rel.target)}"/>`;
}

export function override(partName: string, contentType: string): string {
  return `<Override PartName="${partName}" ContentType="${contentType}"/>`;
}

export function generateContentTypes(
  worksheetCount: number,
  additionalTypes: readonly string[] = [],
): string {
  const additionalDefaults = additionalTypes.filter((type) =>
    type.startsWith("<Default"),
  );
  const additionalOverrides = additionalTypes.filter(
    (type) => !type.startsWith("<Default"),
  );
  const parts = [
    XML_DECLARATION,
    CONTENT_TYPES_HEADER,
    CONTENT_TYPES_DEFAULTS,
    ...additionalDefaults,
    override("/xl/workbook.xml", WORKBOOK_CONTENT_TYPE),
  ];

  for (let i = 0; i < worksheetCount; i++) {
    parts.push(
      override(`/xl/worksheets/sheet${i + 1}.xml`, WORKSHEET_CONTENT_TYPE),
    );
  }

  parts.push(override("/xl/styles.xml", STYLES_CONTENT_TYPE));
  parts.push(override("/xl/sharedStrings.xml", SHARED_STRINGS_CONTENT_TYPE));
  parts.push(...additionalOverrides);
  parts.push("</Types>");

  return parts.join("");
}

export function generateWorkbook(worksheets: readonly Worksheet[]): string {
  const parts = [
    XML_DECLARATION,
    `<workbook xmlns="${SPREADSHEET_NAMESPACE}" xmlns:r="${RELATIONSHIPS_NAMESPACE}">`,
    "<sheets>",
  ];

  for (let i = 0; i < worksheets.length; i++) {
    parts.push(
      `<sheet name="${escapeXml(worksheets[i].name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
    );
  }

  parts.push("</sheets></workbook>");
  return parts.join("");
}

export function generateWorkbookRels(
  worksheetCount: number,
  additionalRelationships: readonly Relationship[] = [],
): string {
  const parts = [XML_DECLARATION, `<Relationships xmlns="${RELS_NAMESPACE}">`];

  for (let i = 0; i < worksheetCount; i++) {
    parts.push(
      relationship(i + 1, WORKSHEET_REL_TYPE, `worksheets/sheet${i + 1}.xml`),
    );
  }

  parts.push(relationship(worksheetCount + 1, STYLES_REL_TYPE, "styles.xml"));
  parts.push(
    relationship(
      worksheetCount + 2,
      SHARED_STRINGS_REL_TYPE,
      "sharedStrings.xml",
    ),
  );
  parts.push(...additionalRelationships.map(relationshipWithId));
  parts.push("</Relationships>");

  return parts.join("");
}

export function generateColumnDefinitions(widths: readonly number[]): string {
  const parts = ["<cols>"];
  for (let i = 0; i < widths.length; i++) {
    parts.push(
      `<col min="${i + 1}" max="${i + 1}" width="${widths[i]}" customWidth="1"/>`,
    );
  }
  parts.push("</cols>");
  return parts.join("");
}

type StyleRecord = Record<string, unknown>;

export interface StyleRegistry {
  readonly styles: readonly StyleRecord[];
  getStyleIndex(style: unknown): number | undefined;
}

function isStyleRecord(value: unknown): value is StyleRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractCellStyle(cell: CellValue): StyleRecord | undefined {
  const isObject =
    typeof cell === "object" && cell !== null && !(cell instanceof Date);
  if (!isObject || !("style" in cell)) return undefined;

  const style = (cell as Cell).style;
  return isStyleRecord(style) && Object.keys(style).length > 0
    ? style
    : undefined;
}

function sortedValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortedValue);
  if (!isStyleRecord(value)) return value;

  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortedValue(value[key]);
      return acc;
    }, {} as StyleRecord);
}

function stableStyleKey(style: StyleRecord): string {
  return JSON.stringify(sortedValue(style));
}

export function createStyleRegistry(
  worksheets: readonly Worksheet[],
): StyleRegistry {
  const styles: StyleRecord[] = [];
  const styleMap = new Map<string, number>();

  for (const sheet of worksheets) {
    for (const row of sheet.data) {
      for (const cell of row) {
        const style = extractCellStyle(cell);
        if (!style) continue;

        const key = stableStyleKey(style);
        if (styleMap.has(key)) continue;

        styles.push(style);
        styleMap.set(key, styles.length);
      }
    }
  }

  return {
    styles,
    getStyleIndex(style: unknown): number | undefined {
      if (!isStyleRecord(style) || Object.keys(style).length === 0) {
        return undefined;
      }

      return styleMap.get(stableStyleKey(style));
    },
  };
}

function styleSection(
  style: StyleRecord,
  key: string,
): StyleRecord | undefined {
  const value = style[key];
  return isStyleRecord(value) ? value : undefined;
}

function styleString(style: StyleRecord, key: string): string | undefined {
  const value = style[key];
  return typeof value === "string" ? value : undefined;
}

function styleNumber(style: StyleRecord, key: string): number | undefined {
  const value = style[key];
  return typeof value === "number" ? value : undefined;
}

function styleBoolean(style: StyleRecord, key: string): boolean | undefined {
  const value = style[key];
  return typeof value === "boolean" ? value : undefined;
}

function normalizeColor(color: unknown): string | undefined {
  if (typeof color !== "string" || color.length === 0) return undefined;

  let normalized = color.replace(/^#/, "").toUpperCase();
  if (normalized.length === 6) normalized = `FF${normalized}`;
  return normalized.length === 8 ? normalized : undefined;
}

function generateFontXml(font?: StyleRecord): string {
  if (!font) return '<font><sz val="11"/><name val="Calibri"/></font>';

  const parts: string[] = [];
  if (styleBoolean(font, "bold")) parts.push("<b/>");
  if (styleBoolean(font, "italic")) parts.push("<i/>");
  if (styleBoolean(font, "underline")) parts.push("<u/>");
  if (styleBoolean(font, "strike")) parts.push("<strike/>");

  const size = styleNumber(font, "size");
  if (size !== undefined) parts.push(`<sz val="${size}"/>`);

  const color = normalizeColor(styleString(font, "color"));
  if (color) parts.push(`<color rgb="${color}"/>`);

  const name = styleString(font, "name");
  if (name) parts.push(`<name val="${escapeXml(name)}"/>`);

  return `<font>${parts.join("")}</font>`;
}

function generateFillXml(fill?: StyleRecord): string {
  const color = normalizeColor(fill?.fgColor ?? fill?.color ?? fill?.bgColor);
  if (!color) return "";

  const pattern = styleString(fill!, "pattern") || "solid";
  return `<fill><patternFill patternType="${escapeXml(pattern)}"><fgColor rgb="${color}"/><bgColor indexed="64"/></patternFill></fill>`;
}

function generateBorderSideXml(sideName: string, side?: StyleRecord): string {
  const borderStyle = styleString(side || {}, "style");
  const hasBorder = borderStyle && borderStyle !== "none";
  if (!hasBorder) return `<${sideName}/>`;

  const color = normalizeColor(side?.color);
  const colorXml = color ? `<color rgb="${color}"/>` : "";
  return `<${sideName} style="${escapeXml(borderStyle)}">${colorXml}</${sideName}>`;
}

function generateBorderXml(border?: StyleRecord): string {
  if (!border) {
    return "<border><left/><right/><top/><bottom/><diagonal/></border>";
  }

  return `<border>${generateBorderSideXml("left", styleSection(border, "left"))}${generateBorderSideXml("right", styleSection(border, "right"))}${generateBorderSideXml("top", styleSection(border, "top"))}${generateBorderSideXml("bottom", styleSection(border, "bottom"))}<diagonal/></border>`;
}

function generateAlignmentXml(alignment?: StyleRecord): string {
  if (!alignment) return "";

  const attrs: string[] = [];
  const horizontal = styleString(alignment, "horizontal");
  const vertical = styleString(alignment, "vertical");
  const indent = styleNumber(alignment, "indent");
  const readingOrder = styleNumber(alignment, "readingOrder");
  const textRotation = styleNumber(alignment, "textRotation");

  if (horizontal) attrs.push(`horizontal="${escapeXml(horizontal)}"`);
  if (vertical) attrs.push(`vertical="${escapeXml(vertical)}"`);
  if (styleBoolean(alignment, "wrapText") !== undefined) {
    attrs.push(`wrapText="${styleBoolean(alignment, "wrapText") ? 1 : 0}"`);
  }
  if (styleBoolean(alignment, "shrinkToFit") !== undefined) {
    attrs.push(
      `shrinkToFit="${styleBoolean(alignment, "shrinkToFit") ? 1 : 0}"`,
    );
  }
  if (indent !== undefined) attrs.push(`indent="${indent}"`);
  if (readingOrder !== undefined) attrs.push(`readingOrder="${readingOrder}"`);
  if (textRotation !== undefined) attrs.push(`textRotation="${textRotation}"`);

  return attrs.length > 0 ? `<alignment ${attrs.join(" ")}/>` : "";
}

interface StyleIds {
  fontId: number;
  fillId: number;
  borderId: number;
  numFmtId: number;
  applyFont: boolean;
  applyFill: boolean;
  applyBorder: boolean;
  applyAlignment: boolean;
  applyNumberFormat: boolean;
  alignment?: StyleRecord;
}

export function generateStylesXml(styles: readonly StyleRecord[] = []): string {
  const fontXml = [generateFontXml()];
  const fillXml = [
    '<fill><patternFill patternType="none"/></fill>',
    '<fill><patternFill patternType="gray125"/></fill>',
  ];
  const borderXml = [generateBorderXml()];
  const numFmts: string[] = [];
  const styleIds: StyleIds[] = [];
  const numFmtMap = new Map<string, number>();
  let nextNumFmtId = 164;

  for (const style of styles) {
    const font = styleSection(style, "font");
    const fill = styleSection(style, "fill");
    const border = styleSection(style, "border");
    const alignment = styleSection(style, "alignment");
    const numberFormat =
      styleString(style, "numFmt") || styleString(style, "numberFormat");

    let numFmtId = 0;
    if (numberFormat) {
      const existing = numFmtMap.get(numberFormat);
      if (existing !== undefined) {
        numFmtId = existing;
      } else {
        numFmtId = nextNumFmtId++;
        numFmtMap.set(numberFormat, numFmtId);
        numFmts.push(
          `<numFmt numFmtId="${numFmtId}" formatCode="${escapeXml(numberFormat)}"/>`,
        );
      }
    }

    const customFill = generateFillXml(fill);
    const customBorder = generateBorderXml(border);

    const fontId = font ? fontXml.push(generateFontXml(font)) - 1 : 0;
    const fillId = customFill ? fillXml.push(customFill) - 1 : 0;
    const borderId = border ? borderXml.push(customBorder) - 1 : 0;

    styleIds.push({
      fontId,
      fillId,
      borderId,
      numFmtId,
      applyFont: Boolean(font),
      applyFill: fillId !== 0,
      applyBorder: Boolean(border),
      applyAlignment: Boolean(alignment),
      applyNumberFormat: Boolean(numberFormat),
      alignment,
    });
  }

  const numFmtsXml =
    numFmts.length > 0
      ? `<numFmts count="${numFmts.length}">${numFmts.join("")}</numFmts>`
      : "";
  const cellXfs = [
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
    ...styleIds.map((ids) => {
      const attrs = [
        `numFmtId="${ids.numFmtId}"`,
        `fontId="${ids.fontId}"`,
        `fillId="${ids.fillId}"`,
        `borderId="${ids.borderId}"`,
        'xfId="0"',
      ];
      if (ids.applyFont) attrs.push('applyFont="1"');
      if (ids.applyFill) attrs.push('applyFill="1"');
      if (ids.applyBorder) attrs.push('applyBorder="1"');
      if (ids.applyAlignment) attrs.push('applyAlignment="1"');
      if (ids.applyNumberFormat) attrs.push('applyNumberFormat="1"');

      const alignmentXml = generateAlignmentXml(ids.alignment);
      return alignmentXml
        ? `<xf ${attrs.join(" ")}>${alignmentXml}</xf>`
        : `<xf ${attrs.join(" ")}/>`;
    }),
  ];

  return `${XML_DECLARATION}<styleSheet xmlns="${SPREADSHEET_NAMESPACE}">${numFmtsXml}<fonts count="${fontXml.length}">${fontXml.join("")}</fonts><fills count="${fillXml.length}">${fillXml.join("")}</fills><borders count="${borderXml.length}">${borderXml.join("")}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${cellXfs.length}">${cellXfs.join("")}</cellXfs></styleSheet>`;
}

export function generateCell(
  colIndex: number,
  rowIndex: number,
  result: CellResult,
  formula?: string,
): string {
  const cellRef = columnIndexToLetters(colIndex) + (rowIndex + 1);
  const styleAttr =
    result.styleIndex !== undefined ? ` s="${result.styleIndex}"` : "";
  const typeAttr = result.type ? ` t="${result.type}"` : "";
  const formulaXml = formula ? `<f>${escapeXml(formula)}</f>` : "";
  const valueXml = result.value !== "" ? `<v>${result.value}</v>` : "";
  return `<c r="${cellRef}"${styleAttr}${typeAttr}>${formulaXml}${valueXml}</c>`;
}

export function generateRow(
  row: readonly CellValue[],
  rowIndex: number,
  addSharedString: (str: string) => number,
  rowHeight?: number,
  styleRegistry?: StyleRegistry,
): string {
  const cellParts: string[] = [];

  for (let colIndex = 0; colIndex < row.length; colIndex++) {
    const cell = row[colIndex];
    const result = getCellResult(cell);
    const formula = extractFormula(cell);

    const hasContent = result.value !== "" || formula;
    if (!hasContent) continue;

    const isString = result.type === "s";
    const finalResult = isString
      ? { type: "s", value: String(addSharedString(result.value)) }
      : result;
    const styleIndex = styleRegistry?.getStyleIndex(extractCellStyle(cell));
    const styledResult =
      styleIndex !== undefined ? { ...finalResult, styleIndex } : finalResult;

    cellParts.push(generateCell(colIndex, rowIndex, styledResult, formula));
  }

  const isEmpty = cellParts.length === 0;
  if (isEmpty) return "";

  const heightAttr = rowHeight ? ` ht="${rowHeight}" customHeight="1"` : "";
  return `<row r="${rowIndex + 1}"${heightAttr}>${cellParts.join("")}</row>`;
}

export function cellRef(col: number, row: number): string {
  return columnIndexToLetters(col) + (row + 1);
}

export function generateMergedCells(mergedCells: readonly MergeCell[]): string {
  const parts = [`<mergeCells count="${mergedCells.length}">`];
  for (const merge of mergedCells) {
    const startRef = cellRef(merge.start.col, merge.start.row);
    const endRef = cellRef(merge.end.col, merge.end.row);
    parts.push(`<mergeCell ref="${startRef}:${endRef}"/>`);
  }
  parts.push("</mergeCells>");
  return parts.join("");
}

export function generateFrozenPane(frozen: FrozenPane): string {
  const row = frozen.rows ?? 0;
  const col = frozen.cols ?? 0;
  const topLeftCell = cellRef(col, row);
  const activePane =
    row > 0 && col > 0 ? "bottomRight" : row > 0 ? "bottomLeft" : "topRight";

  return `<sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane xSplit="${col}" ySplit="${row}" topLeftCell="${topLeftCell}" activePane="${activePane}" state="frozen"/></sheetView></sheetViews>`;
}

export function generateWorksheet(
  sheet: Worksheet,
  addSharedString: (str: string) => number,
  styleRegistry?: StyleRegistry,
): string {
  const parts = [
    XML_DECLARATION,
    `<worksheet xmlns="${SPREADSHEET_NAMESPACE}">`,
  ];

  const hasFrozen = sheet.frozen && (sheet.frozen.rows || sheet.frozen.cols);
  if (hasFrozen) {
    parts.push(generateFrozenPane(sheet.frozen!));
  }

  const hasColumnWidths = sheet.columnWidths && sheet.columnWidths.length > 0;
  if (hasColumnWidths) {
    parts.push(generateColumnDefinitions(sheet.columnWidths!));
  }

  parts.push("<sheetData>");

  const data = sheet.data;
  const rowHeights = sheet.rowHeights;
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const height = rowHeights?.[rowIndex];
    const rowXml = generateRow(
      data[rowIndex],
      rowIndex,
      addSharedString,
      height,
      styleRegistry,
    );
    const hasRow = rowXml !== "";
    if (hasRow) parts.push(rowXml);
  }

  parts.push("</sheetData>");

  const hasMergedCells = sheet.mergedCells && sheet.mergedCells.length > 0;
  if (hasMergedCells) {
    parts.push(generateMergedCells(sheet.mergedCells!));
  }

  parts.push("</worksheet>");
  return parts.join("");
}

export function generateSharedStrings(strings: readonly string[]): string {
  const count = strings.length;
  const parts = [
    XML_DECLARATION,
    `<sst xmlns="${SPREADSHEET_NAMESPACE}" count="${count}" uniqueCount="${count}">`,
  ];

  for (let i = 0; i < count; i++) {
    const preserveSpace = /^\s|\s$|\n|\r/.test(strings[i]);
    const spaceAttr = preserveSpace ? ' xml:space="preserve"' : "";
    parts.push(`<si><t${spaceAttr}>${escapeXml(strings[i])}</t></si>`);
  }

  parts.push("</sst>");
  return parts.join("");
}

export function parseSharedStrings(content: string): string[] {
  const strings: string[] = [];
  const regex = /<t[^>]*>([\s\S]*?)<\/t>/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    strings.push(unescapeXml(match[1]));
  }

  return strings;
}

export function parseWorksheetNames(content: string): string[] {
  const names: string[] = [];
  const regex = /<sheet[^>]*name="([^"]*)"[^>]*>/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    names.push(unescapeXml(match[1]));
  }

  return names;
}

export function parseCellValue(
  type: string | undefined,
  value: string,
  sharedStrings: readonly string[],
): unknown {
  const isSharedString = type === "s";
  if (isSharedString) return sharedStrings[parseInt(value)] || "";

  const isBoolean = type === "b";
  if (isBoolean) return value === "1";

  const isInlineString = type === "str";
  if (isInlineString) return unescapeXml(value);

  return parseNumericValue(value);
}

export function parseWorksheetContent(
  content: string,
  sharedStrings: readonly string[],
): unknown[][] {
  const rows: unknown[][] = [];
  const rowRegex = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  const cellRegex = /<c\s+r="([A-Z]+)(\d+)"([^>]*)>[\s\S]*?<v>([^<]*)<\/v>/g;

  let rowMatch;
  while ((rowMatch = rowRegex.exec(content)) !== null) {
    const rowNum = parseInt(rowMatch[1]) - 1;
    const rowContent = rowMatch[2];
    const row: unknown[] = [];

    let cellMatch;
    cellRegex.lastIndex = 0;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const colLetters = cellMatch[1];
      const attrs = cellMatch[3];
      const type = attrs.match(/\st="([^"]*)"/)?.[1];
      const value = cellMatch[4];

      const colIndex = lettersToColumnIndex(colLetters);
      row[colIndex] = parseCellValue(type, value, sharedStrings);
    }

    rows[rowNum] = row;
  }

  return rows;
}

function extractSection(content: string, pattern: RegExp): string | null {
  const match = content.match(pattern);
  return match ? match[1] : null;
}

function matchAllToArray(content: string, pattern: RegExp): RegExpMatchArray[] {
  return [...content.matchAll(new RegExp(pattern.source, "g"))];
}

function parseColorFromElement(element: string): string | undefined {
  const rgbMatch = element.match(PARSE_COLOR_RGB);
  if (!rgbMatch) return undefined;
  const rgb = rgbMatch[1];
  return rgb.length === 8 ? `#${rgb.slice(2)}` : `#${rgb}`;
}

function parseBorderSideFromContent(
  content: string,
  side: string,
): BorderSide | undefined {
  const sidePattern = new RegExp(
    `<${side}(?:\\s+style="([^"]*)")?[^>]*>([\\s\\S]*?)<\\/${side}>|<${side}(?:\\s+style="([^"]*)")?[^/]*/>`,
  );
  const match = content.match(sidePattern);
  if (!match) return undefined;

  const style = match[1] || match[3];
  if (!style) return undefined;

  const innerContent = match[2] || "";
  const colorMatch = innerContent.match(PARSE_COLOR_ELEMENT);
  const color = colorMatch ? parseColorFromElement(colorMatch[0]) : undefined;

  return { style: style as BorderSide["style"], color };
}

function parseFont(fontContent: string): ParsedFont {
  const sizeMatch = fontContent.match(PARSE_FONT_SIZE);
  const nameMatch = fontContent.match(PARSE_FONT_NAME);
  const colorMatch = fontContent.match(PARSE_COLOR_ELEMENT);

  return {
    bold: PARSE_BOLD.test(fontContent),
    italic: PARSE_ITALIC.test(fontContent),
    size: sizeMatch ? parseFloat(sizeMatch[1]) : undefined,
    color: colorMatch ? parseColorFromElement(colorMatch[0]) : undefined,
    name: nameMatch ? nameMatch[1] : undefined,
  };
}

function parseFill(fillContent: string): ParsedFill {
  const patternMatch = fillContent.match(PARSE_PATTERN_TYPE);
  const fgColorMatch = fillContent.match(PARSE_FG_COLOR);

  return {
    pattern: patternMatch ? patternMatch[1] : undefined,
    color: fgColorMatch ? parseColorFromElement(fgColorMatch[0]) : undefined,
  };
}

function parseBorder(borderContent: string): ParsedBorder {
  return {
    top: parseBorderSideFromContent(borderContent, "top"),
    bottom: parseBorderSideFromContent(borderContent, "bottom"),
    left: parseBorderSideFromContent(borderContent, "left"),
    right: parseBorderSideFromContent(borderContent, "right"),
  };
}

function parseXf(attrs: string, innerContent: string): CellXf {
  const fontIdMatch = attrs.match(PARSE_FONT_ID);
  const fillIdMatch = attrs.match(PARSE_FILL_ID);
  const borderIdMatch = attrs.match(PARSE_BORDER_ID);
  const numFmtIdMatch = attrs.match(PARSE_NUM_FMT_ID);

  let alignment: ParsedAlignment | undefined;
  const alignmentMatch = innerContent.match(PARSE_ALIGNMENT);
  if (alignmentMatch) {
    const alignAttrs = alignmentMatch[1] || alignmentMatch[2] || "";
    const horizontalMatch = alignAttrs.match(PARSE_HORIZONTAL);
    const verticalMatch = alignAttrs.match(PARSE_VERTICAL);
    alignment = {
      horizontal: horizontalMatch
        ? (horizontalMatch[1] as ParsedAlignment["horizontal"])
        : undefined,
      vertical: verticalMatch
        ? (verticalMatch[1] as ParsedAlignment["vertical"])
        : undefined,
      wrapText: PARSE_WRAP_TEXT.test(alignAttrs),
    };
  }

  return {
    fontId: fontIdMatch ? parseInt(fontIdMatch[1]) : undefined,
    fillId: fillIdMatch ? parseInt(fillIdMatch[1]) : undefined,
    borderId: borderIdMatch ? parseInt(borderIdMatch[1]) : undefined,
    numFmtId: numFmtIdMatch ? parseInt(numFmtIdMatch[1]) : undefined,
    applyFont: PARSE_APPLY_FONT.test(attrs),
    applyFill: PARSE_APPLY_FILL.test(attrs),
    applyBorder: PARSE_APPLY_BORDER.test(attrs),
    applyAlignment: PARSE_APPLY_ALIGNMENT.test(attrs),
    alignment,
  };
}

export function parseStyles(content: string): ParsedStyles {
  const numFmts = new Map<number, string>();
  matchAllToArray(content, PARSE_NUM_FMT).forEach((m) => {
    numFmts.set(parseInt(m[1]), unescapeXml(m[2]));
  });

  const fontsSection = extractSection(content, PARSE_FONTS_SECTION);
  const fonts = fontsSection
    ? matchAllToArray(fontsSection, PARSE_FONT).map((m) => parseFont(m[1]))
    : [];

  const fillsSection = extractSection(content, PARSE_FILLS_SECTION);
  const fills = fillsSection
    ? matchAllToArray(fillsSection, PARSE_FILL).map((m) => parseFill(m[1]))
    : [];

  const bordersSection = extractSection(content, PARSE_BORDERS_SECTION);
  const borders = bordersSection
    ? matchAllToArray(bordersSection, PARSE_BORDER).map((m) =>
        parseBorder(m[1]),
      )
    : [];

  const cellXfsSection = extractSection(content, PARSE_CELL_XFS_SECTION);
  const cellXfs = cellXfsSection
    ? matchAllToArray(cellXfsSection, PARSE_XF).map((m) =>
        parseXf(m[1], m[2] || ""),
      )
    : [];

  return { fonts, fills, borders, cellXfs, numFmts };
}

export function parseColumnWidths(content: string): number[] {
  const colsSection = extractSection(content, PARSE_COLS_SECTION);
  if (!colsSection) return [];

  const widths: number[] = [];
  matchAllToArray(colsSection, PARSE_COL).forEach((m) => {
    const min = parseInt(m[1]) - 1;
    const max = parseInt(m[2]) - 1;
    const width = parseFloat(m[3]);
    for (let i = min; i <= max; i++) {
      widths[i] = width;
    }
  });
  return widths;
}

export function parseRowHeights(content: string): (number | undefined)[] {
  const heights: (number | undefined)[] = [];
  matchAllToArray(content, PARSE_ROW_WITH_HEIGHT).forEach((m) => {
    heights[parseInt(m[1]) - 1] = parseFloat(m[2]);
  });
  return heights;
}

function resolveStyle(
  styleIndex: number,
  styles: ParsedStyles,
): CellStyle | undefined {
  const xf = styles.cellXfs[styleIndex];
  if (!xf) return undefined;

  const result: Record<string, unknown> = {};

  const font = xf.fontId !== undefined ? styles.fonts[xf.fontId] : undefined;
  if (font && (font.bold || font.italic || font.size || font.color)) {
    result.font = {
      bold: font.bold || undefined,
      italic: font.italic || undefined,
      size: font.size,
      color: font.color,
    };
  }

  const fill = xf.fillId !== undefined ? styles.fills[xf.fillId] : undefined;
  if (fill?.color && fill.pattern !== "none") {
    result.fill = { color: fill.color };
  }

  const border =
    xf.borderId !== undefined ? styles.borders[xf.borderId] : undefined;
  if (border && (border.top || border.bottom || border.left || border.right)) {
    result.border = border;
  }

  if (xf.alignment) {
    result.alignment = {
      horizontal: xf.alignment.horizontal,
      vertical: xf.alignment.vertical,
    };
  }

  const numFmt =
    xf.numFmtId !== undefined ? styles.numFmts.get(xf.numFmtId) : undefined;
  if (numFmt) {
    result.numberFormat = numFmt;
  }

  return Object.keys(result).length > 0 ? (result as CellStyle) : undefined;
}

function parseCellFromMatch(
  match: RegExpMatchArray,
  sharedStrings: readonly string[],
  styles?: ParsedStyles,
): { colIndex: number; cell: ParsedCell } {
  const colLetters = match[1];
  const styleIdx = match[3] ? parseInt(match[3]) : undefined;
  const type = match[4];
  const formula = match[5] ? unescapeXml(match[5]) : undefined;
  const value = match[6];

  const colIndex = lettersToColumnIndex(colLetters);
  const cellValue =
    value !== undefined ? parseCellValue(type, value, sharedStrings) : null;
  const cellStyle =
    styleIdx !== undefined && styles
      ? resolveStyle(styleIdx, styles)
      : undefined;

  return {
    colIndex,
    cell: { value: cellValue, style: cellStyle, formula },
  };
}

export function parseWorksheetContentWithStyles(
  content: string,
  sharedStrings: readonly string[],
  styles: ParsedStyles,
): {
  data: ParsedCell[][];
  columnWidths: number[];
  rowHeights: (number | undefined)[];
} {
  const columnWidths = parseColumnWidths(content);
  const rowHeights = parseRowHeights(content);

  const rows: ParsedCell[][] = [];
  matchAllToArray(content, PARSE_ROW).forEach((rowMatch) => {
    const rowNum = parseInt(rowMatch[1]) - 1;
    const rowContent = rowMatch[2];
    const row: ParsedCell[] = [];

    matchAllToArray(rowContent, PARSE_CELL).forEach((cellMatch) => {
      const { colIndex, cell } = parseCellFromMatch(
        cellMatch,
        sharedStrings,
        styles,
      );
      row[colIndex] = cell;
    });

    rows[rowNum] = row;
  });

  return { data: rows, columnWidths, rowHeights };
}

export class XlsxWriter {
  private worksheets: Worksheet[] = [];
  private sharedStrings: string[] = [];
  private stringMap: Map<string, number> = new Map();

  addWorksheet(
    name: string,
    data: unknown[][],
    columnWidths?: number[],
    options: Pick<Worksheet, "rowHeights" | "mergedCells" | "frozen"> = {},
  ): void {
    const cells: CellValue[][] = data.map((row) =>
      row.map((value) => {
        const isComplexObject =
          typeof value === "object" &&
          value !== null &&
          !(value instanceof Date);
        return isComplexObject ? (value as CellValue) : (value as CellValue);
      }),
    );

    this.worksheets.push({ name, data: cells, columnWidths, ...options });
  }

  getWorksheets(): readonly Worksheet[] {
    return this.worksheets;
  }

  private resetSharedStrings(): void {
    this.sharedStrings = [];
    this.stringMap = new Map();
  }

  private addSharedString = (str: string): number => {
    const existing = this.stringMap.get(str);
    const hasExisting = existing !== undefined;
    if (hasExisting) return existing;

    const index = this.sharedStrings.length;
    this.sharedStrings.push(str);
    this.stringMap.set(str, index);
    return index;
  };

  generateFiles(
    options: {
      contentTypes?: readonly string[];
      relationships?: readonly Relationship[];
    } = {},
  ): Map<string, string | Uint8Array> {
    this.resetSharedStrings();
    const files = new Map<string, string | Uint8Array>();
    const styleRegistry = createStyleRegistry(this.worksheets);

    const worksheetXml = this.worksheets.map((sheet) =>
      generateWorksheet(sheet, this.addSharedString, styleRegistry),
    );

    files.set(
      "[Content_Types].xml",
      generateContentTypes(this.worksheets.length, options.contentTypes || []),
    );
    files.set("_rels/.rels", ROOT_RELS_XML);
    files.set("xl/workbook.xml", generateWorkbook(this.worksheets));
    files.set(
      "xl/_rels/workbook.xml.rels",
      generateWorkbookRels(this.worksheets.length, options.relationships || []),
    );
    files.set("xl/styles.xml", generateStylesXml(styleRegistry.styles));
    files.set(
      "xl/sharedStrings.xml",
      generateSharedStrings(this.sharedStrings),
    );

    for (let i = 0; i < worksheetXml.length; i++) {
      files.set(`xl/worksheets/sheet${i + 1}.xml`, worksheetXml[i]);
    }

    return files;
  }

  generate(): Uint8Array {
    return zipWorkbookFiles(this.generateFiles());
  }

  async generateCompressed(): Promise<Uint8Array> {
    return zipWorkbookFilesCompressed(this.generateFiles());
  }
}

export function zipWorkbookFiles(
  files: ReadonlyMap<string, string | Uint8Array>,
): Uint8Array {
  const zip = new MiniZip();
  files.forEach((content, path) => zip.addFile(path, content));
  return zip.generate();
}

export function zipWorkbookFilesCompressed(
  files: ReadonlyMap<string, string | Uint8Array>,
): Promise<Uint8Array> {
  const zip = new MiniZip();
  files.forEach((content, path) => zip.addFile(path, content));
  return zip.generateCompressed();
}

export class XlsxReader {
  private zip: MiniUnzip;

  constructor(data: Uint8Array) {
    this.zip = new MiniUnzip(data);
  }

  read(): WorkbookData {
    const sharedStringsContent = this.zip.getFile("xl/sharedStrings.xml");
    const sharedStrings = sharedStringsContent
      ? parseSharedStrings(sharedStringsContent)
      : [];

    const workbookContent = this.zip.getFile("xl/workbook.xml");
    const sheetNames = workbookContent
      ? parseWorksheetNames(workbookContent)
      : [];

    const sheets: ParsedSheet[] = sheetNames.map((name, i) => {
      const content = this.zip.getFile(`xl/worksheets/sheet${i + 1}.xml`);
      const data = content ? parseWorksheetContent(content, sharedStrings) : [];
      return { name, data };
    });

    return { sheets };
  }

  async readAsync(): Promise<WorkbookData> {
    const sharedStringsContent = await this.zip.getFileAsync(
      "xl/sharedStrings.xml",
    );
    const sharedStrings = sharedStringsContent
      ? parseSharedStrings(sharedStringsContent)
      : [];

    const workbookContent = await this.zip.getFileAsync("xl/workbook.xml");
    const sheetNames = workbookContent
      ? parseWorksheetNames(workbookContent)
      : [];

    const sheets: ParsedSheet[] = await Promise.all(
      sheetNames.map(async (name, i) => {
        const content = await this.zip.getFileAsync(
          `xl/worksheets/sheet${i + 1}.xml`,
        );
        const data = content
          ? parseWorksheetContent(content, sharedStrings)
          : [];
        return { name, data };
      }),
    );

    return { sheets };
  }

  readWithStyles(): WorkbookDataWithStyles {
    const sharedStringsContent = this.zip.getFile("xl/sharedStrings.xml");
    const sharedStrings = sharedStringsContent
      ? parseSharedStrings(sharedStringsContent)
      : [];

    const stylesContent = this.zip.getFile("xl/styles.xml");
    const styles = stylesContent
      ? parseStyles(stylesContent)
      : { fonts: [], fills: [], borders: [], cellXfs: [], numFmts: new Map() };

    const workbookContent = this.zip.getFile("xl/workbook.xml");
    const sheetNames = workbookContent
      ? parseWorksheetNames(workbookContent)
      : [];

    const sheets: ParsedSheetWithStyles[] = sheetNames.map((name, i) => {
      const content = this.zip.getFile(`xl/worksheets/sheet${i + 1}.xml`);
      if (!content) return { name, data: [], columnWidths: [], rowHeights: [] };

      const { data, columnWidths, rowHeights } =
        parseWorksheetContentWithStyles(content, sharedStrings, styles);
      return { name, data, columnWidths, rowHeights };
    });

    return { sheets };
  }

  async readWithStylesAsync(): Promise<WorkbookDataWithStyles> {
    const [sharedStringsContent, stylesContent, workbookContent] =
      await Promise.all([
        this.zip.getFileAsync("xl/sharedStrings.xml"),
        this.zip.getFileAsync("xl/styles.xml"),
        this.zip.getFileAsync("xl/workbook.xml"),
      ]);

    const sharedStrings = sharedStringsContent
      ? parseSharedStrings(sharedStringsContent)
      : [];
    const styles = stylesContent
      ? parseStyles(stylesContent)
      : { fonts: [], fills: [], borders: [], cellXfs: [], numFmts: new Map() };
    const sheetNames = workbookContent
      ? parseWorksheetNames(workbookContent)
      : [];

    const sheets: ParsedSheetWithStyles[] = await Promise.all(
      sheetNames.map(async (name, i) => {
        const content = await this.zip.getFileAsync(
          `xl/worksheets/sheet${i + 1}.xml`,
        );
        if (!content)
          return { name, data: [], columnWidths: [], rowHeights: [] };

        const { data, columnWidths, rowHeights } =
          parseWorksheetContentWithStyles(content, sharedStrings, styles);
        return { name, data, columnWidths, rowHeights };
      }),
    );

    return { sheets };
  }
}
