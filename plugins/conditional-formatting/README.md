# @xldx/conditional-formatting

Add conditional formatting rules to Excel worksheets.

## Installation

```bash
bun add @xldx/conditional-formatting
```

## Usage

```typescript
import { Xldx } from "xldx";
import {
  conditionalFormattingPlugin,
  addRule,
} from "@xldx/conditional-formatting";

const plugin = conditionalFormattingPlugin();

const xldx = new Xldx(data)
  .use(plugin)
  .createSheet({ name: "Sales" }, ...columns);

// Color scale (red → yellow → green)
addRule(plugin, {
  type: "colorScale",
  range: "B2:B100",
  colors: ["#FF0000", "#FFFF00", "#00FF00"],
});

// Data bars
addRule(plugin, {
  type: "dataBar",
  range: "C2:C100",
  color: "#638EC6",
});

const xlsx = await xldx.toUint8Array();
```

## Rule Types

### Color Scale

```typescript
addRule(plugin, {
  type: 'colorScale',
  range: 'A1:A10',
  colors: ['#FF0000', '#00FF00']           // 2-color
  // or
  colors: ['#FF0000', '#FFFF00', '#00FF00'] // 3-color
});
```

### Data Bar

```typescript
addRule(plugin, {
  type: "dataBar",
  range: "B1:B10",
  color: "#638EC6",
  showValue: true, // optional, default true
});
```

### Icon Set

```typescript
addRule(plugin, {
  type: "iconSet",
  range: "C1:C10",
  iconSet: "3Arrows",
});
```

Available: `3Arrows`, `3ArrowsGray`, `3Flags`, `3TrafficLights1`, `3TrafficLights2`, `3Signs`, `3Symbols`, `3Symbols2`, `4Arrows`, `4ArrowsGray`, `4Rating`, `4RedToBlack`, `4TrafficLights`, `5Arrows`, `5ArrowsGray`, `5Rating`, `5Quarters`

### Cell Value Rules

```typescript
addRule(plugin, {
  type: "cellIs",
  range: "D1:D10",
  operator: "greaterThan",
  value: 100,
  style: {
    bgColor: "#FF0000",
    fontColor: "#FFFFFF",
    bold: true,
    italic: false,
  },
});
```

Operators: `equal`, `notEqual`, `greaterThan`, `lessThan`, `greaterThanOrEqual`, `lessThanOrEqual`, `between`, `notBetween`

### Expression Rules

```typescript
addRule(plugin, {
  type: "expression",
  range: "E1:E10",
  formula: "$A1>10",
  style: { bgColor: "#FFFF00" },
});
```

## License

[O'Sassy](https://osaasy.dev)
