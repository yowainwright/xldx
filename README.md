# xldx

JS Excel file builder with zero dependencies.

## Installation

```bash
npm install xldx
# or
bun add xldx
```

## Features

- **Zero dependencies**
- Pattern-based styling and theming
- Multi-sheet support
- Full type safety
- Works in browsers and node, bun, or deno
- < 17KB minified

## Quick Start

```typescript
import { Xldx } from 'xldx';

// Sample data
const data = [
  { id: 1, name: 'John', age: 30, status: 'active' },
  { id: 2, name: 'Jane', age: 25, status: 'inactive' },
  { id: 3, name: 'Bob', age: 35, status: 'active' }
];

// Create Excel builder
const xlsx = new Xldx(data);

// Create a sheet with columns
xlsx.createSheet(
  { name: 'Users' },
  { key: 'id', header: 'ID', width: 10 },
  { key: 'name', header: 'Name', width: 20 },
  { key: 'age', header: 'Age', width: 10 },
  { key: 'status', header: 'Status', width: 15 }
);

// node, bun, or deno - write to file
await xlsx.write('users.xlsx');

// Browser - trigger download
await xlsx.download('users.xlsx');

// Get raw data
const buffer = await xlsx.toBuffer(); // Buffer
const uint8Array = await xlsx.toUint8Array(); // Uint8Array
const blob = await xlsx.toBlob(); // Browser Blob
```

## Advanced Usage

### Themes

```typescript
import { Xldx, themes } from 'xldx';

const xlsx = new Xldx(data);
xlsx.setTheme(themes.dark);
```

### Pattern-Based Styling

```typescript
xlsx.createSheet(
  { name: 'StyledSheet' },
  {
    key: 'status',
    header: 'Status',
    patterns: {
      bgColorPattern: (context) => {
        if (context.value === 'active') {
          return { fill: { type: 'pattern', pattern: 'solid', fgColor: '90EE90FF' } };
        }
        return null;
      }
    }
  }
);
```

### Zebra Striping

```typescript
xlsx.createSheet(
  { name: 'ZebraSheet' },
  {
    key: 'data',
    patterns: {
      bgColorPattern: 'zebra' // Built-in zebra pattern
    }
  }
);
```

## API

### Constructor

```typescript
new Xldx(data: DataRow[] | SheetsData, options?: XldxOptions)
```

### Methods

- `setTheme(theme: ColorTheme): this` - Set the color theme
- `createSheet(options: SheetOptions, ...columns: ColumnDefinition[]): this` - Create a new worksheet
- `createSheets(sheets: Array<{options: SheetOptions; columns: ColumnDefinition[]}>): this` - Create multiple worksheets
- `toBuffer(): Promise<Buffer>` - Generate Excel file as Buffer (node, bun, or deno)
- `toUint8Array(): Promise<Uint8Array>` - Generate Excel file as Uint8Array
- `toBlob(): Promise<Blob>` - Generate Excel file as Blob (Browser)
- `download(filename?: string): Promise<void>` - Trigger file download (Browser only)
- `write(filePath: string): Promise<void>` - Write Excel file to disk (node, bun, or deno only)
- `toJSON(): any` - Export workbook structure as JSON
- `static fromJSON(json: any): Xldx` - Create from JSON structure
- `static read(data: Uint8Array | Buffer): Promise<any>` - Read XLSX file

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build

# Lint
bun run lint

# Type check
bun run typecheck
```

## License

MIT