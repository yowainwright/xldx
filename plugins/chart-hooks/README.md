# @xldx/chart-hooks

Hook into Excel's chart engine. Generate chart XML that Excel renders.

## Installation

```bash
bun add @xldx/chart-hooks
```

## Usage

```typescript
import { Xldx } from "xldx";
import { chartHooksPlugin, addChart } from "@xldx/chart-hooks";

const plugin = chartHooksPlugin();

const xldx = new Xldx(data)
  .use(plugin)
  .createSheet({ name: "Sales" }, ...columns);

addChart(plugin, {
  type: "bar",
  series: [{ dataRange: "$B$2:$B$10", labelRange: "$A$2:$A$10" }],
  position: "E2",
  title: "Sales by Region",
  sheet: "Sales",
});

const xlsx = await xldx.toUint8Array();
```

## Chart Types

### Bar Chart (Horizontal)

```typescript
addChart(plugin, {
  type: "bar",
  series: [{ dataRange: "$B$2:$B$10", labelRange: "$A$2:$A$10" }],
  position: "E2",
  title: "Horizontal Bars",
});
```

### Column Chart (Vertical)

```typescript
addChart(plugin, {
  type: "column",
  series: [{ dataRange: "$B$2:$B$10", labelRange: "$A$2:$A$10" }],
  position: "E2",
  title: "Vertical Columns",
});
```

### Line Chart

```typescript
addChart(plugin, {
  type: "line",
  series: [
    { name: "2023", dataRange: "$B$2:$B$13" },
    { name: "2024", dataRange: "$C$2:$C$13" },
  ],
  position: "E2",
  title: "Monthly Trends",
});
```

### Pie Chart

```typescript
addChart(plugin, {
  type: "pie",
  series: [{ dataRange: "$B$2:$B$6", labelRange: "$A$2:$A$6" }],
  position: "D2",
  title: "Market Share",
});
```

### Area Chart

```typescript
addChart(plugin, {
  type: "area",
  series: [{ dataRange: "$B$2:$B$10" }],
  position: "E2",
  title: "Cumulative Growth",
});
```

### Scatter Chart

```typescript
addChart(plugin, {
  type: "scatter",
  series: [{ dataRange: "$B$2:$B$50" }],
  position: "E2",
  title: "Correlation",
});
```

## API

### `chartHooksPlugin()`

Creates a new chart hooks plugin instance.

### `addChart(plugin, options)`

Adds a chart to the workbook.

```typescript
interface ChartOptions {
  type: "bar" | "column" | "line" | "pie" | "area" | "scatter";
  series: ChartSeries[];
  position: string | ChartPosition;
  title?: string;
  sheet?: string;
  showLegend?: boolean;
  legendPosition?: "top" | "bottom" | "left" | "right";
}

interface ChartSeries {
  name?: string;
  dataRange: string; // e.g., "$B$2:$B$10"
  labelRange?: string; // e.g., "$A$2:$A$10"
}

interface ChartPosition {
  cell: string; // e.g., "E2"
  width?: number; // pixels
  height?: number; // pixels
  offsetX?: number; // pixels
  offsetY?: number; // pixels
}
```

## Examples

### Multiple Series

```typescript
addChart(plugin, {
  type: "column",
  series: [
    { name: "Q1", dataRange: "$B$2:$B$5" },
    { name: "Q2", dataRange: "$C$2:$C$5" },
    { name: "Q3", dataRange: "$D$2:$D$5" },
    { name: "Q4", dataRange: "$E$2:$E$5" },
  ],
  position: { cell: "G2", width: 600, height: 400 },
  title: "Quarterly Sales",
  showLegend: true,
  legendPosition: "bottom",
});
```

### Multiple Charts

```typescript
// Sales chart
addChart(plugin, {
  type: "bar",
  series: [{ dataRange: "$B$2:$B$10" }],
  position: "E2",
  title: "Sales",
  sheet: "Dashboard",
});

// Expenses chart
addChart(plugin, {
  type: "pie",
  series: [{ dataRange: "$C$2:$C$6" }],
  position: "E20",
  title: "Expenses",
  sheet: "Dashboard",
});
```

## How It Works

This plugin generates the XLSX XML structure for charts:

- `xl/charts/chartN.xml` - Chart definition
- `xl/drawings/drawingN.xml` - Chart positioning
- Relationships and content types

Excel reads this XML and renders the chart. We don't evaluate or render anything - we just create the hooks for Excel to do its job.

## License

[O'Sassy](https://osaasy.dev)
