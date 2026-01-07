import { describe, it, expect, beforeEach } from "bun:test";
import { chartHooksPlugin, addChart } from "../src/index";
import type { ChartOptions } from "../src/types";
import pkg from "../package.json";

describe("@xldx/chart-hooks", () => {
  describe("chartHooksPlugin", () => {
    it("creates plugin with correct name and version", () => {
      const plugin = chartHooksPlugin();
      expect(plugin.name).toBe(pkg.name);
      expect(plugin.version).toBe(pkg.version);
    });

    it("initializes with empty charts map", () => {
      const plugin = chartHooksPlugin();
      expect(plugin.charts.size).toBe(0);
    });

    it("has afterGenerate hook", () => {
      const plugin = chartHooksPlugin();
      expect(typeof plugin.afterGenerate).toBe("function");
    });
  });

  describe("addChart", () => {
    it("adds a bar chart", () => {
      const plugin = chartHooksPlugin();

      addChart(plugin, {
        type: "bar",
        series: [{ dataRange: "$B$2:$B$10", labelRange: "$A$2:$A$10" }],
        position: "E2",
        title: "Sales",
        sheet: "Sheet1",
      });

      expect(plugin.charts.size).toBe(1);
      expect(plugin.charts.get("Sheet1")?.length).toBe(1);
    });

    it("adds a line chart", () => {
      const plugin = chartHooksPlugin();

      addChart(plugin, {
        type: "line",
        series: [{ dataRange: "$B$2:$B$10" }],
        position: "E2",
        sheet: "Sheet1",
      });

      const charts = plugin.charts.get("Sheet1");
      expect(charts?.[0].options.type).toBe("line");
    });

    it("adds a pie chart", () => {
      const plugin = chartHooksPlugin();

      addChart(plugin, {
        type: "pie",
        series: [{ dataRange: "$B$2:$B$5", labelRange: "$A$2:$A$5" }],
        position: "D2",
        sheet: "Sheet1",
      });

      const charts = plugin.charts.get("Sheet1");
      expect(charts?.[0].options.type).toBe("pie");
    });

    it("adds multiple charts to same sheet", () => {
      const plugin = chartHooksPlugin();

      addChart(plugin, {
        type: "bar",
        series: [{ dataRange: "$B$2:$B$10" }],
        position: "E2",
        sheet: "Sheet1",
      });

      addChart(plugin, {
        type: "line",
        series: [{ dataRange: "$C$2:$C$10" }],
        position: "E20",
        sheet: "Sheet1",
      });

      expect(plugin.charts.get("Sheet1")?.length).toBe(2);
    });

    it("adds charts to different sheets", () => {
      const plugin = chartHooksPlugin();

      addChart(plugin, {
        type: "bar",
        series: [{ dataRange: "$B$2:$B$10" }],
        position: "E2",
        sheet: "Sheet1",
      });

      addChart(plugin, {
        type: "pie",
        series: [{ dataRange: "$B$2:$B$5" }],
        position: "D2",
        sheet: "Sheet2",
      });

      expect(plugin.charts.size).toBe(2);
      expect(plugin.charts.get("Sheet1")?.length).toBe(1);
      expect(plugin.charts.get("Sheet2")?.length).toBe(1);
    });

    it("defaults to Sheet1 when sheet not specified", () => {
      const plugin = chartHooksPlugin();

      addChart(plugin, {
        type: "bar",
        series: [{ dataRange: "$B$2:$B$10" }],
        position: "E2",
      });

      expect(plugin.charts.has("Sheet1")).toBe(true);
    });

    it("supports position object with dimensions", () => {
      const plugin = chartHooksPlugin();

      addChart(plugin, {
        type: "bar",
        series: [{ dataRange: "$B$2:$B$10" }],
        position: { cell: "E2", width: 600, height: 400 },
        sheet: "Sheet1",
      });

      const charts = plugin.charts.get("Sheet1");
      const pos = charts?.[0].options.position;
      expect(typeof pos).toBe("object");
      if (typeof pos === "object") {
        expect(pos.width).toBe(600);
        expect(pos.height).toBe(400);
      }
    });

    it("supports multiple series", () => {
      const plugin = chartHooksPlugin();

      addChart(plugin, {
        type: "bar",
        series: [
          { name: "2023", dataRange: "$B$2:$B$10" },
          { name: "2024", dataRange: "$C$2:$C$10" },
        ],
        position: "E2",
        sheet: "Sheet1",
      });

      const charts = plugin.charts.get("Sheet1");
      expect(charts?.[0].options.series.length).toBe(2);
    });

    it("increments chart counter", () => {
      const plugin = chartHooksPlugin();

      addChart(plugin, {
        type: "bar",
        series: [{ dataRange: "$B$2:$B$10" }],
        position: "E2",
      });

      addChart(plugin, {
        type: "line",
        series: [{ dataRange: "$C$2:$C$10" }],
        position: "E20",
      });

      expect(plugin.chartCounter).toBe(2);
    });
  });

  describe("afterGenerate", () => {
    it("generates chart XML files", () => {
      const plugin = chartHooksPlugin();
      const files = new Map<string, string | Uint8Array>();

      files.set("[Content_Types].xml", '<?xml version="1.0"?><Types></Types>');
      files.set(
        "xl/workbook.xml",
        '<workbook><sheets><sheet name="Sheet1" sheetId="1"/></sheets></workbook>',
      );
      files.set("xl/worksheets/sheet1.xml", "<worksheet></worksheet>");

      addChart(plugin, {
        type: "bar",
        series: [{ dataRange: "$B$2:$B$10" }],
        position: "E2",
        sheet: "Sheet1",
      });

      plugin.afterGenerate!(files);

      expect(files.has("xl/charts/chart1.xml")).toBe(true);
      expect(files.has("xl/drawings/drawing1.xml")).toBe(true);
    });

    it("generates drawing relationships", () => {
      const plugin = chartHooksPlugin();
      const files = new Map<string, string | Uint8Array>();

      files.set("[Content_Types].xml", '<?xml version="1.0"?><Types></Types>');
      files.set(
        "xl/workbook.xml",
        '<workbook><sheets><sheet name="Sheet1" sheetId="1"/></sheets></workbook>',
      );
      files.set("xl/worksheets/sheet1.xml", "<worksheet></worksheet>");

      addChart(plugin, {
        type: "bar",
        series: [{ dataRange: "$B$2:$B$10" }],
        position: "E2",
        sheet: "Sheet1",
      });

      plugin.afterGenerate!(files);

      expect(files.has("xl/drawings/_rels/drawing1.xml.rels")).toBe(true);
      expect(files.has("xl/worksheets/_rels/sheet1.xml.rels")).toBe(true);
    });

    it("updates content types", () => {
      const plugin = chartHooksPlugin();
      const files = new Map<string, string | Uint8Array>();

      files.set("[Content_Types].xml", '<?xml version="1.0"?><Types></Types>');
      files.set(
        "xl/workbook.xml",
        '<workbook><sheets><sheet name="Sheet1" sheetId="1"/></sheets></workbook>',
      );
      files.set("xl/worksheets/sheet1.xml", "<worksheet></worksheet>");

      addChart(plugin, {
        type: "bar",
        series: [{ dataRange: "$B$2:$B$10" }],
        position: "E2",
        sheet: "Sheet1",
      });

      plugin.afterGenerate!(files);

      const contentTypes = files.get("[Content_Types].xml") as string;
      expect(contentTypes).toContain("chart");
      expect(contentTypes).toContain("drawing");
    });

    it("adds drawing reference to worksheet", () => {
      const plugin = chartHooksPlugin();
      const files = new Map<string, string | Uint8Array>();

      files.set("[Content_Types].xml", '<?xml version="1.0"?><Types></Types>');
      files.set(
        "xl/workbook.xml",
        '<workbook><sheets><sheet name="Sheet1" sheetId="1"/></sheets></workbook>',
      );
      files.set("xl/worksheets/sheet1.xml", "<worksheet></worksheet>");

      addChart(plugin, {
        type: "bar",
        series: [{ dataRange: "$B$2:$B$10" }],
        position: "E2",
        sheet: "Sheet1",
      });

      plugin.afterGenerate!(files);

      const sheetContent = files.get("xl/worksheets/sheet1.xml") as string;
      expect(sheetContent).toContain("drawing");
    });
  });
});
