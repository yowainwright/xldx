import { describe, it, expect } from "bun:test";
import { conditionalFormattingPlugin, addRule } from "../src/index";
import pkg from "../package.json";

describe("conditionalFormattingPlugin", () => {
  it("should create a plugin with correct name and version", () => {
    const plugin = conditionalFormattingPlugin();
    expect(plugin.name).toBe(pkg.name);
    expect(plugin.version).toBe(pkg.version);
  });

  it("should add and retrieve color scale rules", () => {
    const plugin = conditionalFormattingPlugin();
    plugin.addRule({
      type: "colorScale",
      range: "A1:A10",
      colors: ["#FF0000", "#00FF00"],
    });

    const rules = plugin.getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].type).toBe("colorScale");
    expect(rules[0].range).toBe("A1:A10");
  });

  it("should add data bar rules", () => {
    const plugin = conditionalFormattingPlugin();
    plugin.addRule({
      type: "dataBar",
      range: "B1:B10",
      color: "#638EC6",
    });

    const rules = plugin.getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].type).toBe("dataBar");
  });

  it("should add icon set rules", () => {
    const plugin = conditionalFormattingPlugin();
    plugin.addRule({
      type: "iconSet",
      range: "C1:C10",
      iconSet: "3Arrows",
    });

    const rules = plugin.getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].type).toBe("iconSet");
  });

  it("should add cellIs rules", () => {
    const plugin = conditionalFormattingPlugin();
    plugin.addRule({
      type: "cellIs",
      range: "D1:D10",
      operator: "greaterThan",
      value: 100,
      style: { bgColor: "#FF0000" },
    });

    const rules = plugin.getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].type).toBe("cellIs");
  });

  it("should add expression rules", () => {
    const plugin = conditionalFormattingPlugin();
    plugin.addRule({
      type: "expression",
      range: "E1:E10",
      formula: "$A1>10",
      style: { fontColor: "#0000FF", bold: true },
    });

    const rules = plugin.getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].type).toBe("expression");
  });

  it("should generate conditional formatting XML", () => {
    const plugin = conditionalFormattingPlugin();
    plugin.addRule({
      type: "colorScale",
      range: "A1:A10",
      colors: ["#FF0000", "#FFFF00", "#00FF00"],
    });

    const xml = plugin.generateConditionalFormattingXml();
    expect(xml).toContain("<conditionalFormatting");
    expect(xml).toContain("colorScale");
    expect(xml).toContain("A1:A10");
  });

  it("should generate dxfs XML for cellIs and expression rules", () => {
    const plugin = conditionalFormattingPlugin();
    plugin.addRule({
      type: "cellIs",
      range: "A1:A10",
      operator: "equal",
      value: 0,
      style: {
        bgColor: "#FF0000",
        fontColor: "#FFFFFF",
        bold: true,
        italic: true,
      },
    });

    const dxfsXml = plugin.generateDxfsXml();
    expect(dxfsXml).toContain("<dxfs");
    expect(dxfsXml).toContain("<font>");
    expect(dxfsXml).toContain("<b/>");
    expect(dxfsXml).toContain("<i/>");
    expect(dxfsXml).toContain("<fill>");
  });

  it("should return empty dxfs XML when no cellIs/expression rules", () => {
    const plugin = conditionalFormattingPlugin();
    plugin.addRule({
      type: "colorScale",
      range: "A1:A10",
      colors: ["#FF0000", "#00FF00"],
    });

    const dxfsXml = plugin.generateDxfsXml();
    expect(dxfsXml).toBe("");
  });

  it("should inject XML into worksheet in afterGenerate", () => {
    const plugin = conditionalFormattingPlugin();
    plugin.addRule({
      type: "dataBar",
      range: "A1:A10",
      color: "#638EC6",
    });

    const files = new Map<string, string | Uint8Array>();
    files.set(
      "xl/worksheets/sheet1.xml",
      '<?xml version="1.0"?><worksheet><sheetData></sheetData></worksheet>',
    );
    files.set(
      "xl/styles.xml",
      '<?xml version="1.0"?><styleSheet></styleSheet>',
    );

    plugin.afterGenerate?.(files);

    const worksheet = files.get("xl/worksheets/sheet1.xml") as string;
    expect(worksheet).toContain("<conditionalFormatting");
    expect(worksheet).toContain("dataBar");
  });

  it("should not modify files when no rules", () => {
    const plugin = conditionalFormattingPlugin();
    const files = new Map<string, string | Uint8Array>();
    const originalContent =
      '<?xml version="1.0"?><worksheet><sheetData></sheetData></worksheet>';
    files.set("xl/worksheets/sheet1.xml", originalContent);

    plugin.afterGenerate?.(files);

    expect(files.get("xl/worksheets/sheet1.xml")).toBe(originalContent);
  });
});

describe("addRule helper", () => {
  it("should add rule via helper function", () => {
    const plugin = conditionalFormattingPlugin();
    addRule(plugin, {
      type: "dataBar",
      range: "A1:A10",
      color: "#FF0000",
    });

    const rules = plugin.getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].type).toBe("dataBar");
  });
});
