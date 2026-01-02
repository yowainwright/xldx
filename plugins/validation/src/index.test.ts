import { describe, it, expect } from "bun:test";
import { validationPlugin, addValidation } from "./index";
import type { ListValidation, NumericValidation } from "./types";

describe("@xldx/validation", () => {
  describe("validationPlugin", () => {
    it("should create a plugin with correct name and version", () => {
      const plugin = validationPlugin();

      expect(plugin.name).toBe("@xldx/validation");
      expect(plugin.version).toBe("0.0.1");
    });

    it("should have empty validations map initially", () => {
      const plugin = validationPlugin();

      expect(plugin.validations.size).toBe(0);
    });

    it("should have required plugin methods", () => {
      const plugin = validationPlugin();

      expect(typeof plugin.beforeGenerate).toBe("function");
      expect(typeof plugin.afterGenerate).toBe("function");
    });
  });

  describe("addValidation", () => {
    it("should add a list validation rule", () => {
      const plugin = validationPlugin();
      const rule: ListValidation & { sheet: string } = {
        type: "list",
        sheet: "Sheet1",
        range: "B2:B100",
        values: ["Option 1", "Option 2", "Option 3"],
      };

      addValidation(plugin, rule);

      expect(plugin.validations.size).toBe(1);
      expect(plugin.validations.get("Sheet1")).toHaveLength(1);
      expect(plugin.validations.get("Sheet1")![0]).toEqual(rule);
    });

    it("should add a numeric validation rule", () => {
      const plugin = validationPlugin();
      const rule: NumericValidation & { sheet: string } = {
        type: "whole",
        sheet: "Sheet1",
        range: "C2:C100",
        operator: "between",
        value1: 1,
        value2: 100,
      };

      addValidation(plugin, rule);

      expect(plugin.validations.get("Sheet1")![0].type).toBe("whole");
    });

    it("should add multiple validations to the same sheet", () => {
      const plugin = validationPlugin();

      addValidation(plugin, {
        type: "list",
        sheet: "Sheet1",
        range: "A1:A10",
        values: ["Yes", "No"],
      });

      addValidation(plugin, {
        type: "whole",
        sheet: "Sheet1",
        range: "B1:B10",
        operator: "greaterThan",
        value1: 0,
      });

      expect(plugin.validations.get("Sheet1")).toHaveLength(2);
    });

    it("should add validations to different sheets", () => {
      const plugin = validationPlugin();

      addValidation(plugin, {
        type: "list",
        sheet: "Sheet1",
        range: "A1:A10",
        values: ["A", "B"],
      });

      addValidation(plugin, {
        type: "list",
        sheet: "Sheet2",
        range: "A1:A10",
        values: ["C", "D"],
      });

      expect(plugin.validations.size).toBe(2);
      expect(plugin.validations.get("Sheet1")).toHaveLength(1);
      expect(plugin.validations.get("Sheet2")).toHaveLength(1);
    });
  });

  describe("afterGenerate", () => {
    it("should inject dataValidations XML into worksheet", () => {
      const plugin = validationPlugin();

      addValidation(plugin, {
        type: "list",
        sheet: "TestSheet",
        range: "A1:A10",
        values: ["Yes", "No"],
      });

      const files = new Map<string, string | Uint8Array>();
      files.set(
        "xl/workbook.xml",
        '<workbook><sheets><sheet name="TestSheet" sheetId="1" r:id="rId1"/></sheets></workbook>',
      );
      files.set(
        "xl/worksheets/sheet1.xml",
        "<worksheet><sheetData></sheetData></worksheet>",
      );

      plugin.afterGenerate!(files);

      const sheetContent = files.get("xl/worksheets/sheet1.xml") as string;
      expect(sheetContent).toContain('<dataValidations count="1">');
      expect(sheetContent).toContain('type="list"');
      expect(sheetContent).toContain('sqref="A1:A10"');
      expect(sheetContent).toContain('"Yes,No"');
    });

    it("should handle multiple validations", () => {
      const plugin = validationPlugin();

      addValidation(plugin, {
        type: "list",
        sheet: "TestSheet",
        range: "A1:A10",
        values: ["Yes", "No"],
      });

      addValidation(plugin, {
        type: "whole",
        sheet: "TestSheet",
        range: "B1:B10",
        operator: "between",
        value1: 1,
        value2: 100,
      });

      const files = new Map<string, string | Uint8Array>();
      files.set(
        "xl/workbook.xml",
        '<workbook><sheets><sheet name="TestSheet" sheetId="1" r:id="rId1"/></sheets></workbook>',
      );
      files.set(
        "xl/worksheets/sheet1.xml",
        "<worksheet><sheetData></sheetData></worksheet>",
      );

      plugin.afterGenerate!(files);

      const sheetContent = files.get("xl/worksheets/sheet1.xml") as string;
      expect(sheetContent).toContain('<dataValidations count="2">');
    });

    it("should not modify sheet if no validations for that sheet", () => {
      const plugin = validationPlugin();

      addValidation(plugin, {
        type: "list",
        sheet: "OtherSheet",
        range: "A1:A10",
        values: ["Yes", "No"],
      });

      const files = new Map<string, string | Uint8Array>();
      files.set(
        "xl/workbook.xml",
        '<workbook><sheets><sheet name="TestSheet" sheetId="1" r:id="rId1"/></sheets></workbook>',
      );
      const originalContent = "<worksheet><sheetData></sheetData></worksheet>";
      files.set("xl/worksheets/sheet1.xml", originalContent);

      plugin.afterGenerate!(files);

      expect(files.get("xl/worksheets/sheet1.xml")).toBe(originalContent);
    });

    it("should include error message attributes when specified", () => {
      const plugin = validationPlugin();

      addValidation(plugin, {
        type: "list",
        sheet: "TestSheet",
        range: "A1:A10",
        values: ["Yes", "No"],
        showErrorMessage: true,
        errorStyle: "stop",
        errorTitle: "Invalid Input",
        error: "Please select from the list",
      });

      const files = new Map<string, string | Uint8Array>();
      files.set(
        "xl/workbook.xml",
        '<workbook><sheets><sheet name="TestSheet" sheetId="1" r:id="rId1"/></sheets></workbook>',
      );
      files.set(
        "xl/worksheets/sheet1.xml",
        "<worksheet><sheetData></sheetData></worksheet>",
      );

      plugin.afterGenerate!(files);

      const sheetContent = files.get("xl/worksheets/sheet1.xml") as string;
      expect(sheetContent).toContain('errorStyle="stop"');
      expect(sheetContent).toContain('errorTitle="Invalid Input"');
      expect(sheetContent).toContain('error="Please select from the list"');
    });

    it("should include input message attributes when specified", () => {
      const plugin = validationPlugin();

      addValidation(plugin, {
        type: "list",
        sheet: "TestSheet",
        range: "A1:A10",
        values: ["Yes", "No"],
        showInputMessage: true,
        promptTitle: "Select Option",
        prompt: "Choose Yes or No",
      });

      const files = new Map<string, string | Uint8Array>();
      files.set(
        "xl/workbook.xml",
        '<workbook><sheets><sheet name="TestSheet" sheetId="1" r:id="rId1"/></sheets></workbook>',
      );
      files.set(
        "xl/worksheets/sheet1.xml",
        "<worksheet><sheetData></sheetData></worksheet>",
      );

      plugin.afterGenerate!(files);

      const sheetContent = files.get("xl/worksheets/sheet1.xml") as string;
      expect(sheetContent).toContain('showInputMessage="1"');
      expect(sheetContent).toContain('promptTitle="Select Option"');
      expect(sheetContent).toContain('prompt="Choose Yes or No"');
    });

    it("should handle textLength validation", () => {
      const plugin = validationPlugin();

      addValidation(plugin, {
        type: "textLength",
        sheet: "TestSheet",
        range: "A1:A10",
        operator: "between",
        value1: 5,
        value2: 50,
      });

      const files = new Map<string, string | Uint8Array>();
      files.set(
        "xl/workbook.xml",
        '<workbook><sheets><sheet name="TestSheet" sheetId="1" r:id="rId1"/></sheets></workbook>',
      );
      files.set(
        "xl/worksheets/sheet1.xml",
        "<worksheet><sheetData></sheetData></worksheet>",
      );

      plugin.afterGenerate!(files);

      const sheetContent = files.get("xl/worksheets/sheet1.xml") as string;
      expect(sheetContent).toContain('type="textLength"');
      expect(sheetContent).toContain('operator="between"');
      expect(sheetContent).toContain("<formula1>5</formula1>");
      expect(sheetContent).toContain("<formula2>50</formula2>");
    });

    it("should handle custom validation with formula", () => {
      const plugin = validationPlugin();

      addValidation(plugin, {
        type: "custom",
        sheet: "TestSheet",
        range: "A1:A10",
        formula: "=AND(A1>0,A1<100)",
      });

      const files = new Map<string, string | Uint8Array>();
      files.set(
        "xl/workbook.xml",
        '<workbook><sheets><sheet name="TestSheet" sheetId="1" r:id="rId1"/></sheets></workbook>',
      );
      files.set(
        "xl/worksheets/sheet1.xml",
        "<worksheet><sheetData></sheetData></worksheet>",
      );

      plugin.afterGenerate!(files);

      const sheetContent = files.get("xl/worksheets/sheet1.xml") as string;
      expect(sheetContent).toContain('type="custom"');
      expect(sheetContent).toContain("=AND(A1&gt;0,A1&lt;100)");
    });
  });
});
