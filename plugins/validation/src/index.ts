import type { XldxPlugin, WorkbookContext } from "xldx";
import pkg from "../package.json";
import type {
  ValidationRule,
  ListValidation,
  NumericValidation,
} from "./types";

export type {
  ValidationRule,
  ListValidation,
  NumericValidation,
} from "./types";
export type {
  ValidationType,
  ValidationOperator,
  ValidationErrorStyle,
  BaseValidation,
  DateValidation,
  TimeValidation,
  TextLengthValidation,
  CustomValidation,
} from "./types";

const OPERATOR_MAP: Record<string, string> = {
  between: "between",
  notBetween: "notBetween",
  equal: "equal",
  notEqual: "notEqual",
  greaterThan: "greaterThan",
  lessThan: "lessThan",
  greaterThanOrEqual: "greaterThanOrEqual",
  lessThanOrEqual: "lessThanOrEqual",
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateValidationXml(rule: ValidationRule): string {
  const attrs: string[] = [`sqref="${rule.range}"`];

  if (rule.allowBlank !== false) {
    attrs.push('allowBlank="1"');
  }

  if (rule.showInputMessage) {
    attrs.push('showInputMessage="1"');
    if (rule.promptTitle)
      attrs.push(`promptTitle="${escapeXml(rule.promptTitle)}"`);
    if (rule.prompt) attrs.push(`prompt="${escapeXml(rule.prompt)}"`);
  }

  if (rule.showErrorMessage !== false) {
    attrs.push('showErrorMessage="1"');
    if (rule.errorStyle) attrs.push(`errorStyle="${rule.errorStyle}"`);
    if (rule.errorTitle)
      attrs.push(`errorTitle="${escapeXml(rule.errorTitle)}"`);
    if (rule.error) attrs.push(`error="${escapeXml(rule.error)}"`);
  }

  let formula1 = "";
  let formula2 = "";

  if (rule.type === "list") {
    attrs.push('type="list"');
    if (rule.showDropDown !== false) {
      attrs.push('showDropDown="1"');
    }
    formula1 = `<formula1>"${rule.values.map(escapeXml).join(",")}"</formula1>`;
  } else if (rule.type === "whole" || rule.type === "decimal") {
    attrs.push(`type="${rule.type}"`);
    attrs.push(`operator="${OPERATOR_MAP[rule.operator]}"`);
    if (rule.value1 !== undefined) {
      formula1 = `<formula1>${rule.value1}</formula1>`;
    }
    if (rule.value2 !== undefined) {
      formula2 = `<formula2>${rule.value2}</formula2>`;
    }
  } else if (rule.type === "textLength") {
    attrs.push('type="textLength"');
    attrs.push(`operator="${OPERATOR_MAP[rule.operator]}"`);
    if (rule.value1 !== undefined) {
      formula1 = `<formula1>${rule.value1}</formula1>`;
    }
    if (rule.value2 !== undefined) {
      formula2 = `<formula2>${rule.value2}</formula2>`;
    }
  } else if (rule.type === "custom") {
    attrs.push('type="custom"');
    formula1 = `<formula1>${escapeXml(rule.formula)}</formula1>`;
  }

  return `<dataValidation ${attrs.join(" ")}>${formula1}${formula2}</dataValidation>`;
}

interface ValidationPluginState {
  validations: Map<string, ValidationRule[]>;
}

export function validationPlugin(): XldxPlugin & ValidationPluginState {
  const state: ValidationPluginState = {
    validations: new Map(),
  };

  return {
    name: pkg.name,
    version: pkg.version,
    validations: state.validations,

    beforeGenerate(context: WorkbookContext): void {
      // No-op: validations are added via afterGenerate
    },

    afterGenerate(files: Map<string, string | Uint8Array>): void {
      state.validations.forEach((rules, sheetName) => {
        const sheetIndex = findSheetIndex(files, sheetName);
        if (sheetIndex === -1) return;

        const sheetPath = `xl/worksheets/sheet${sheetIndex + 1}.xml`;
        const content = files.get(sheetPath);
        if (typeof content !== "string") return;

        const validationsXml = rules.map(generateValidationXml).join("");
        const dataValidationsXml = `<dataValidations count="${rules.length}">${validationsXml}</dataValidations>`;

        // Insert before </worksheet>
        const updatedContent = content.replace(
          "</worksheet>",
          `${dataValidationsXml}</worksheet>`,
        );
        files.set(sheetPath, updatedContent);
      });
    },
  };
}

function findSheetIndex(
  files: Map<string, string | Uint8Array>,
  sheetName: string,
): number {
  const workbookContent = files.get("xl/workbook.xml");
  if (typeof workbookContent !== "string") return -1;

  const sheetRegex = /<sheet[^>]*name="([^"]*)"[^>]*>/g;
  let match;
  let index = 0;

  while ((match = sheetRegex.exec(workbookContent)) !== null) {
    if (match[1] === sheetName) {
      return index;
    }
    index++;
  }

  return -1;
}

export function addValidation(
  plugin: ValidationPluginState,
  rule: ValidationRule & { sheet: string },
): void {
  const sheetName = rule.sheet;
  const existingRules = plugin.validations.get(sheetName) || [];
  existingRules.push(rule);
  plugin.validations.set(sheetName, existingRules);
}
