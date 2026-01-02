/**
 * Pre-computed column letter cache for Excel cell references.
 * Covers columns A through ZZ (702 columns).
 *
 * Excel uses base-26 column notation:
 *   - A-Z for columns 1-26
 *   - AA-AZ for columns 27-52
 *   - BA-BZ for columns 53-78
 *   - etc.
 */
export const COLUMN_CACHE: readonly string[] = buildColumnCache();

function buildColumnCache(): string[] {
  const cache: string[] = [];
  for (let i = 0; i < 702; i++) {
    cache[i] = columnIndexToLetters(i);
  }
  return cache;
}

function columnIndexToLetters(index: number): string {
  let col = index + 1;
  let letters = "";
  while (col > 0) {
    col--;
    letters = String.fromCharCode(65 + (col % 26)) + letters;
    col = Math.floor(col / 26);
  }
  return letters;
}

export const EXCEL_EPOCH_MS = new Date(1900, 0, 1).getTime();
export const MS_PER_DAY = 86400000;
export const EXCEL_DATE_OFFSET = 2;

export const XML_DECLARATION =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

export const CONTENT_TYPES_HEADER =
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">';
export const CONTENT_TYPES_DEFAULTS =
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>';

export const WORKBOOK_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml";
export const WORKSHEET_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml";
export const STYLES_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml";
export const SHARED_STRINGS_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml";

export const RELS_NAMESPACE =
  "http://schemas.openxmlformats.org/package/2006/relationships";
export const OFFICE_DOC_REL_TYPE =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument";
export const WORKSHEET_REL_TYPE =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet";
export const STYLES_REL_TYPE =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles";
export const SHARED_STRINGS_REL_TYPE =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings";

export const SPREADSHEET_NAMESPACE =
  "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
export const RELATIONSHIPS_NAMESPACE =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

export const DEFAULT_STYLES_XML = `${XML_DECLARATION}<styleSheet xmlns="${SPREADSHEET_NAMESPACE}"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`;

export const ROOT_RELS_XML = `${XML_DECLARATION}<Relationships xmlns="${RELS_NAMESPACE}"><Relationship Id="rId1" Type="${OFFICE_DOC_REL_TYPE}" Target="xl/workbook.xml"/></Relationships>`;

// Parsing regex patterns
export const PARSE_SHARED_STRING = /<t[^>]*>(.*?)<\/t>/g;
export const PARSE_SHEET_NAME = /<sheet[^>]*name="([^"]*)"[^>]*>/g;
export const PARSE_NUM_FMT =
  /<numFmt\s+numFmtId="(\d+)"\s+formatCode="([^"]*)"/g;
export const PARSE_FONTS_SECTION = /<fonts[^>]*>([\s\S]*?)<\/fonts>/;
export const PARSE_FONT = /<font>([\s\S]*?)<\/font>/g;
export const PARSE_FILLS_SECTION = /<fills[^>]*>([\s\S]*?)<\/fills>/;
export const PARSE_FILL = /<fill>([\s\S]*?)<\/fill>/g;
export const PARSE_BORDERS_SECTION = /<borders[^>]*>([\s\S]*?)<\/borders>/;
export const PARSE_BORDER = /<border>([\s\S]*?)<\/border>/g;
export const PARSE_CELL_XFS_SECTION = /<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/;
export const PARSE_XF = /<xf([^>]*)(?:\/>|>([\s\S]*?)<\/xf>)/g;
export const PARSE_COLS_SECTION = /<cols>([\s\S]*?)<\/cols>/;
export const PARSE_COL = /<col\s+min="(\d+)"\s+max="(\d+)"\s+width="([^"]+)"/g;
export const PARSE_ROW_WITH_HEIGHT =
  /<row[^>]*r="(\d+)"[^>]*ht="([^"]+)"[^>]*>/g;
export const PARSE_ROW = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
export const PARSE_CELL =
  /<c\s+r="([A-Z]+)(\d+)"(?:\s+s="(\d+)")?(?:\s+t="([^"]*)")?[^>]*>(?:<f>([^<]*)<\/f>)?[\s\S]*?(?:<v>([^<]*)<\/v>)?/g;
export const PARSE_CELL_SIMPLE =
  /<c\s+r="([A-Z]+)(\d+)"(?:\s+t="([^"]*)")?[^>]*>[\s\S]*?<v>([^<]*)<\/v>/g;

// Style attribute patterns
export const PARSE_COLOR_RGB = /rgb="([^"]+)"/;
export const PARSE_BOLD = /<b\s*\/?>/;
export const PARSE_ITALIC = /<i\s*\/?>/;
export const PARSE_FONT_SIZE = /sz\s+val="([^"]+)"/;
export const PARSE_FONT_NAME = /name\s+val="([^"]+)"/;
export const PARSE_PATTERN_TYPE = /patternType="([^"]+)"/;
export const PARSE_FG_COLOR = /<fgColor[^>]*>/;
export const PARSE_COLOR_ELEMENT = /<color[^>]*>/;
export const PARSE_ALIGNMENT =
  /<alignment([^>]*)\/?>|<alignment([^>]*)>([\s\S]*?)<\/alignment>/;
export const PARSE_HORIZONTAL = /horizontal="([^"]+)"/;
export const PARSE_VERTICAL = /vertical="([^"]+)"/;
export const PARSE_WRAP_TEXT = /wrapText="1"/;
export const PARSE_FONT_ID = /fontId="(\d+)"/;
export const PARSE_FILL_ID = /fillId="(\d+)"/;
export const PARSE_BORDER_ID = /borderId="(\d+)"/;
export const PARSE_NUM_FMT_ID = /numFmtId="(\d+)"/;
export const PARSE_APPLY_FONT = /applyFont="1"/;
export const PARSE_APPLY_FILL = /applyFill="1"/;
export const PARSE_APPLY_BORDER = /applyBorder="1"/;
export const PARSE_APPLY_ALIGNMENT = /applyAlignment="1"/;
