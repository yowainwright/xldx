import type { Demo } from "./types";

export const CONTENT = {
  heading: "Everything you need, nothing you don't",
  subheading:
    "From simple exports to complex workbooks with charts and validation.",
} as const;

export const DEMOS: Demo[] = [
  {
    id: "basic",
    label: "Basic Usage",
    title: "Create Excel files in seconds",
    description: "Pass your data, define columns, download. That's it.",
    code: `import { Xldx } from "xldx";

const data = [
  { name: "Alice", sales: 5200, region: "West" },
  { name: "Bob", sales: 4800, region: "East" },
  { name: "Carol", sales: 6100, region: "West" },
];

const xldx = new Xldx(data);
xldx.createSheet(
  { name: "Sales Report" },
  { key: "name", header: "Name", width: 120 },
  { key: "sales", header: "Sales", width: 100 },
  { key: "region", header: "Region", width: 80 }
);

const xlsx = await xldx.toUint8Array();`,
  },
  {
    id: "styling",
    label: "Styling",
    title: "Rich formatting without the complexity",
    description: "Fonts, colors, borders, alignment—all type-safe.",
    code: `xldx.createSheet(
  {
    name: "Styled Report",
    defaultStyle: {
      font: { name: "Arial", size: 11 },
      alignment: { vertical: "middle" }
    }
  },
  {
    key: "name",
    header: "Name",
    style: {
      font: { bold: true },
      fill: { type: "pattern", pattern: "solid", fgColor: "#E8F4FD" }
    }
  },
  {
    key: "sales",
    header: "Sales",
    style: { numFmt: "$#,##0.00" }
  }
);`,
  },
  {
    id: "patterns",
    label: "Patterns",
    title: "Dynamic styling based on data",
    description: "Zebra stripes, conditional colors, diff highlighting.",
    code: `import { Xldx, zebraBg, colorPerDiff } from "xldx";

xldx.createSheet(
  { name: "Dynamic Styles" },
  {
    key: "name",
    header: "Name",
    patterns: { bgColorPattern: zebraBg }
  },
  {
    key: "status",
    header: "Status",
    patterns: { bgColorPattern: colorPerDiff }
  }
);

// Or create custom patterns
const highlightHigh = (ctx) =>
  ctx.value > 1000
    ? { fill: { fgColor: "#90EE90" } }
    : null;`,
  },
  {
    id: "plugins",
    label: "Plugins",
    title: "Extend with optional features",
    description: "Images, charts, validation, comments—add only what you need.",
    code: `import { Xldx } from "xldx";
import { chartHooksPlugin, addChart } from "@xldx/chart-hooks";
import { validationPlugin, addValidation } from "@xldx/validation";

const charts = chartHooksPlugin();
const validation = validationPlugin();

const xldx = new Xldx(data)
  .use(charts)
  .use(validation)
  .createSheet({ name: "Dashboard" }, ...columns);

addChart(charts, {
  type: "bar",
  series: [{ dataRange: "$B$2:$B$10" }],
  position: "E2",
  title: "Sales by Region"
});

addValidation(validation, {
  sheet: "Dashboard",
  type: "list",
  range: "C2:C100",
  values: ["Active", "Pending", "Closed"]
});`,
  },
  {
    id: "reading",
    label: "Reading",
    title: "Read existing Excel files",
    description: "Parse XLSX files with full style information.",
    code: `import { Xldx } from "xldx";

// Read file from input or fetch
const buffer = await file.arrayBuffer();
const workbook = await Xldx.read(new Uint8Array(buffer));

console.log(workbook.sheets);
// [{ name: "Sheet1", data: [["A1", "B1"], ["A2", "B2"]] }]

// Read with style information
const styled = Xldx.readWithStyles(new Uint8Array(buffer));
styled.sheets[0].data[0][0];
// { value: "A1", style: { font: { bold: true } } }`,
  },
];

export const STYLES = {
  section: "px-4 py-24 sm:px-6 lg:px-8",
  header: "mx-auto max-w-3xl text-center",
  heading: "text-3xl font-bold",
  subheading: "mt-4 text-lg text-muted-foreground",
  tabs: "mx-auto mt-12 max-w-4xl",
  tabsList: "grid w-full grid-cols-5",
  card: "mt-6",
} as const;
