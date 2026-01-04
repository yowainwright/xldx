import type { XldxPlugin } from "xldx";
import type {
  ConditionalFormatRule,
  ColorScaleRule,
  DataBarRule,
  IconSetRule,
  CellIsRule,
  ExpressionRule,
  InternalRule,
  RuleStyle,
} from "./types";
import { PLUGIN_NAME, PLUGIN_VERSION, ICON_COUNTS, OPERATOR_MAP } from "./constants";

export type {
  ConditionalFormatType,
  ColorScaleRule,
  DataBarRule,
  IconSetType,
  IconSetRule,
  CellIsOperator,
  RuleStyle,
  CellIsRule,
  ExpressionRule,
  ConditionalFormatRule,
  InternalRule,
} from "./types";

function hexToArgb(hex: string): string {
  const clean = hex.replace("#", "");
  return `FF${clean.toUpperCase()}`;
}

function generateColorScaleXml(rule: ColorScaleRule, priority: number): string {
  const colors = rule.colors;
  const isThreeColor = colors.length === 3;

  const minCfvo = '<cfvo type="min"/>';
  const midCfvo = isThreeColor ? '<cfvo type="percentile" val="50"/>' : "";
  const maxCfvo = '<cfvo type="max"/>';

  const minColor = `<color rgb="${hexToArgb(colors[0])}"/>`;
  const midColor = isThreeColor ? `<color rgb="${hexToArgb(colors[1])}"/>` : "";
  const maxColor = `<color rgb="${hexToArgb(colors[isThreeColor ? 2 : 1])}"/>`;

  return `<conditionalFormatting sqref="${rule.range}">
<cfRule type="colorScale" priority="${priority}">
<colorScale>${minCfvo}${midCfvo}${maxCfvo}${minColor}${midColor}${maxColor}</colorScale>
</cfRule>
</conditionalFormatting>`;
}

function generateDataBarXml(rule: DataBarRule, priority: number): string {
  const showValue = rule.showValue !== false;
  return `<conditionalFormatting sqref="${rule.range}">
<cfRule type="dataBar" priority="${priority}">
<dataBar showValue="${showValue ? 1 : 0}">
<cfvo type="min"/>
<cfvo type="max"/>
<color rgb="${hexToArgb(rule.color)}"/>
</dataBar>
</cfRule>
</conditionalFormatting>`;
}

function generateIconSetXml(rule: IconSetRule, priority: number): string {
  const count = ICON_COUNTS[rule.iconSet] || 3;
  const cfvos = Array.from({ length: count }, (_, i) => {
    if (i === 0) return '<cfvo type="percent" val="0"/>';
    const percent = Math.round((100 / count) * i);
    return `<cfvo type="percent" val="${percent}"/>`;
  }).join("");

  return `<conditionalFormatting sqref="${rule.range}">
<cfRule type="iconSet" priority="${priority}">
<iconSet iconSet="${rule.iconSet}">${cfvos}</iconSet>
</cfRule>
</conditionalFormatting>`;
}

function generateCellIsXml(rule: CellIsRule, priority: number, dxfId: number): string {
  const formulas =
    rule.operator === "between" || rule.operator === "notBetween"
      ? `<formula>${rule.value}</formula><formula>${rule.value2}</formula>`
      : `<formula>${rule.value}</formula>`;

  return `<conditionalFormatting sqref="${rule.range}">
<cfRule type="cellIs" dxfId="${dxfId}" priority="${priority}" operator="${OPERATOR_MAP[rule.operator]}">
${formulas}
</cfRule>
</conditionalFormatting>`;
}

function generateExpressionXml(rule: ExpressionRule, priority: number, dxfId: number): string {
  return `<conditionalFormatting sqref="${rule.range}">
<cfRule type="expression" dxfId="${dxfId}" priority="${priority}">
<formula>${rule.formula}</formula>
</cfRule>
</conditionalFormatting>`;
}

function generateDxfXml(style: RuleStyle): string {
  const parts: string[] = [];

  if (style.fontColor || style.bold || style.italic) {
    const fontParts: string[] = [];
    if (style.bold) fontParts.push("<b/>");
    if (style.italic) fontParts.push("<i/>");
    if (style.fontColor) fontParts.push(`<color rgb="${hexToArgb(style.fontColor)}"/>`);
    parts.push(`<font>${fontParts.join("")}</font>`);
  }

  if (style.bgColor) {
    parts.push(
      `<fill><patternFill patternType="solid"><bgColor rgb="${hexToArgb(style.bgColor)}"/></patternFill></fill>`,
    );
  }

  return `<dxf>${parts.join("")}</dxf>`;
}

export function conditionalFormattingPlugin(): XldxPlugin & {
  addRule(rule: ConditionalFormatRule): void;
  getRules(): readonly ConditionalFormatRule[];
  generateConditionalFormattingXml(): string;
  generateDxfsXml(): string;
} {
  const rules: InternalRule[] = [];
  let priorityCounter = 1;

  return {
    name: PLUGIN_NAME,
    version: PLUGIN_VERSION,

    addRule(rule: ConditionalFormatRule): void {
      rules.push({
        sheetIndex: 0,
        rule,
        priority: priorityCounter++,
      });
    },

    getRules(): readonly ConditionalFormatRule[] {
      return rules.map((r) => r.rule);
    },

    generateConditionalFormattingXml(): string {
      let dxfIndex = 0;
      return rules
        .map((r) => {
          switch (r.rule.type) {
            case "colorScale":
              return generateColorScaleXml(r.rule, r.priority);
            case "dataBar":
              return generateDataBarXml(r.rule, r.priority);
            case "iconSet":
              return generateIconSetXml(r.rule, r.priority);
            case "cellIs":
              return generateCellIsXml(r.rule, r.priority, dxfIndex++);
            case "expression":
              return generateExpressionXml(r.rule, r.priority, dxfIndex++);
            default:
              return "";
          }
        })
        .join("\n");
    },

    generateDxfsXml(): string {
      const dxfs = rules
        .filter((r) => r.rule.type === "cellIs" || r.rule.type === "expression")
        .map((r) => {
          const rule = r.rule as CellIsRule | ExpressionRule;
          return generateDxfXml(rule.style);
        });

      if (dxfs.length === 0) return "";
      return `<dxfs count="${dxfs.length}">${dxfs.join("")}</dxfs>`;
    },

    afterGenerate(files: Map<string, string | Uint8Array>): void {
      if (rules.length === 0) return;

      const worksheetPath = "xl/worksheets/sheet1.xml";
      const worksheet = files.get(worksheetPath);
      if (typeof worksheet !== "string") return;

      const cfXml = this.generateConditionalFormattingXml();
      const insertPoint = worksheet.indexOf("</sheetData>");
      if (insertPoint === -1) return;

      const updatedWorksheet =
        worksheet.slice(0, insertPoint + 12) + cfXml + worksheet.slice(insertPoint + 12);
      files.set(worksheetPath, updatedWorksheet);

      const dxfsXml = this.generateDxfsXml();
      if (dxfsXml) {
        const stylesPath = "xl/styles.xml";
        const styles = files.get(stylesPath);
        if (typeof styles === "string") {
          const styleSheetEnd = styles.indexOf("</styleSheet>");
          if (styleSheetEnd !== -1) {
            const updatedStyles =
              styles.slice(0, styleSheetEnd) + dxfsXml + styles.slice(styleSheetEnd);
            files.set(stylesPath, updatedStyles);
          }
        }
      }
    },

    getContentTypes(): readonly string[] {
      return [];
    },

    getRelationships(): readonly { id: string; type: string; target: string }[] {
      return [];
    },
  };
}

export function addRule(
  plugin: ReturnType<typeof conditionalFormattingPlugin>,
  rule: ConditionalFormatRule,
): void {
  plugin.addRule(rule);
}
