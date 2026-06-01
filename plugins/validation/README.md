# @xldx/validation

Add data validation rules to Excel worksheets.

## Installation

```bash
bun add @xldx/validation
```

## Usage

```typescript
import { Xldx } from "xldx";
import { validationPlugin, addValidation } from "@xldx/validation";

const plugin = validationPlugin();

const xldx = new Xldx(data)
  .use(plugin)
  .createSheet({ name: "Form" }, ...columns);

// Dropdown list
addValidation(plugin, {
  sheet: "Form",
  type: "list",
  range: "B2:B100",
  values: ["Option 1", "Option 2", "Option 3"],
});

// Number constraint
addValidation(plugin, {
  sheet: "Form",
  type: "whole",
  range: "C2:C100",
  operator: "between",
  value1: 1,
  value2: 100,
});

const xlsx = await xldx.toUint8Array();
```

## API

### `validationPlugin()`

Creates a new validation plugin instance.

### `addValidation(plugin, rule)`

Adds a validation rule to the plugin.

```typescript
interface ValidationRule {
  sheet: string; // Sheet name
  range: string; // Cell range (e.g., "A1:A10")
  type: ValidationType; // 'list' | 'whole' | 'decimal' | 'textLength' | 'custom'

  // For list type
  values?: string[]; // Dropdown options
  showDropDown?: boolean; // Show dropdown arrow (default: true)

  // For numeric/textLength types
  operator?: ValidationOperator;
  value1?: number;
  value2?: number; // For 'between' and 'notBetween'

  // For custom type
  formula?: string;

  // Optional settings
  allowBlank?: boolean;
  showInputMessage?: boolean;
  promptTitle?: string;
  prompt?: string;
  showErrorMessage?: boolean;
  errorStyle?: "stop" | "warning" | "information";
  errorTitle?: string;
  error?: string;
}
```

## Validation Types

### List (Dropdown)

```typescript
addValidation(plugin, {
  sheet: "Form",
  type: "list",
  range: "A1:A10",
  values: ["Red", "Green", "Blue"],
});
```

### Whole Number

```typescript
addValidation(plugin, {
  sheet: "Form",
  type: "whole",
  range: "B1:B10",
  operator: "between",
  value1: 1,
  value2: 100,
});
```

### Decimal Number

```typescript
addValidation(plugin, {
  sheet: "Form",
  type: "decimal",
  range: "C1:C10",
  operator: "lessThanOrEqual",
  value1: 99.99,
});
```

### Text Length

```typescript
addValidation(plugin, {
  sheet: "Form",
  type: "textLength",
  range: "D1:D10",
  operator: "lessThanOrEqual",
  value1: 50,
});
```

### Custom Formula

```typescript
addValidation(plugin, {
  sheet: "Form",
  type: "custom",
  range: "E1:E10",
  formula: "=AND(E1>0, E1<A1)",
});
```

## Operators

- `equal`
- `notEqual`
- `greaterThan`
- `lessThan`
- `greaterThanOrEqual`
- `lessThanOrEqual`
- `between`
- `notBetween`

## License

[O'Sassy](https://osaasy.dev)
