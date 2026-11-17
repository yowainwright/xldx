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
- Native arithmetic, references, ranges, and SUM

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

<!-- public Xldx methods and Workbook types from src/index.ts and src/types.ts -->

- `setTheme(theme: ColorTheme): this` - Set the color theme
- `createSheet(options: SheetOptions, ...columns: ColumnDefinition[]): this` - Create a new worksheet
- `createSheets(sheets: Array<{options: SheetOptions; columns: ColumnDefinition[]}>): this` - Create multiple worksheets
- `toBuffer(): Promise<Buffer>` - Generate Excel file as Buffer (node, bun, or deno)
- `toUint8Array(): Promise<Uint8Array>` - Generate Excel file as Uint8Array
- `toBlob(): Promise<Blob>` - Generate Excel file as Blob (Browser)
- `download(filename?: string): Promise<void>` - Trigger file download (Browser only)
- `write(filePath: string): Promise<void>` - Write Excel file to disk (node, bun, or deno only)
- `toJSON(): Workbook` - Export workbook structure as JSON
- `calculate(): Calculation` - Return a fresh calculated workbook and cell diagnostics
- `static fromJSON(json: Partial<Workbook>): Xldx` - Create from JSON structure
- `static read(data: Uint8Array): Promise<Workbook>` - Read XLSX file (Buffers are Uint8Arrays)

Exports use the current sheet data, including edits made after an earlier export.
`fromJSON` restores sheets for both editing and export. Restored columns use
zero-based string keys (`"0"`, `"1"`, …), preserving duplicate or non-string
headers without treating them as object keys.

The package selects browser or Node methods and declarations through conditional
exports. Use `xldx/browser` or `xldx/server` when selecting an environment explicitly.
NodeNext TypeScript consumers can use the root `xldx` import.

### Formulas

<!-- formula factories from src/formula/index.ts and calculation from src/index.ts -->

```typescript
import { Formula, Xldx } from 'xldx';

const data = [[2, Formula.multiply(Formula.ref('A1'), 2)]];
const book = Xldx.fromJSON({ sheets: [{ name: 'Data', data }] });
book.getSheetData('Data').updateCellData('A1', 3);
const { workbook, issues } = book.calculate(); // B1 result: 6
```

Factories: `parse`, `ref`, `range`, `sum`, `add`, `subtract`, `multiply`, and `divide`.
Use `Formula.sum(Formula.range('A1', 'A5'))`; string arguments are literal text.
Formula JSON is `{ formula: 'A1*2', result: 6 }`; `result` is optional, and stored text has no leading `=`.
`result` accepts finite numbers, strings, booleans, or `{ error: '#DIV/0!' }` and
the other classic Excel error codes. Formula-shaped objects are reserved and validated.

`toJSON()` retains source values and caches; `calculate()` returns fresh results
without mutating them. XLSX export recalculates and writes formulas with available
caches. Unsupported expressions retain their source, omit stale caches, and produce
diagnostics. Ordinary strings beginning with `=` remain literal.

Supported syntax is `+ - * /`, unary signs, parentheses, numbers, quoted strings,
booleans, same-sheet A1 references with optional `$`, and rectangular ranges inside
SUM. `SEQUENCE(rows, columns, start, step)` generates a rectangular array; optional
trailing arguments default to 1. `MID(text, start, length)` extracts text and maps
over array arguments. Array arithmetic and unary signs calculate element by element;
an error stays in its own cell without discarding neighboring results.
An array result spills from its formula cell into empty neighboring cells;
occupied cells or worksheet edges report `#SPILL!`. Calculated sheets expose their
spill ranges as `spills`; source JSON retains only the anchor formula. XLSX export
writes the array range, cached results, and dynamic-array metadata.
References interpret styled `{ value }` cells and dates using the same conversion
as XLSX export.

Other functions, cross-sheet references, array literals, spill-range operators,
and locale conversions are unsupported. Cycles report `#REF!` with a cycle diagnostic. Calculation limits are
8,192 characters per expression, 128 nesting levels, and 100,000 cell visits per
worksheet pass. Addressed edits include the header at A1; existing body row index
zero remains A2. The homepage supports selection, formula-bar edits, and direct
editing by double-click or Enter/F2.

XLSX imports currently support uncompressed ZIP entries, normal single-cell
formulas, and dynamic arrays carrying XLDAPR metadata. Compressed entries and
shared/legacy-array/data-table formulas fail explicitly.
`fromJSON` rejects imported arrays that the engine cannot recalculate, preserving
the caller's cached workbook data instead of silently discarding generated cells.
The independent Excel fixture and its provenance are in `fixtures/formula/`.

## Development

<!-- development commands matching package.json scripts and mise.toml -->

Tool versions are pinned in `mise.toml` for local development and CI, including
Bun 1.4.4, Node.js 26.7.0, and the native linters. Source, tests, scripts, and
Oxlint/Oxfmt configurations are TypeScript. Native linters use their supported
configuration formats: `.fs-lintrc`, `.src-lintrc`, `.legibilityrc`, and
`mise.toml` for tool installation.

Node benchmarks run TypeScript with extensionless imports using the installed
`jiti/register` resolver. Browser benchmarks use real Playwright Chromium.
Reports are written to `tmp/module-current/`; set `REPORT_DIR` to retain another run.

<!-- workspace task orchestration from turbo.json and both package.json files -->
Workspace build, test, typecheck, lint, format, and development commands run
through Turbo. The library build produces `dist/` before the site builds its
Vinext output and static export. Build and check results are cached; lint and
format always run. Root tests wait for the library build, lint, and typecheck
because the lint-policy tests temporarily create invalid source files.

```bash
# Install the pinned toolchain
mise install

# Install dependencies
bun install

# Run tests
bun run test
bun run test:unit
bun run test:integration
bun run test:e2e

# Build the library and site
bun run build

# Lint
bun run lint

# Format
bun run format
bun run format:check

# Type check
bun run typecheck

# Measure consumer bundles and export performance
bun run size
bun run benchmark:node
bunx playwright install chromium
bun run benchmark:browser

# Dependency checks and updates
bun run deps:check
bun run deps:security
bun run deps:overrides
bun run update
```

<!-- deployment behavior from .github/workflows/gh-pages.yml -->
GitHub Pages deployment is manual. Run **Deploy to GitHub Pages** from Actions
and answer **Deploy to Pages?**: **Yes** builds and deploys; **No** builds and
skips deployment without failing the workflow. Build and deployment errors
still fail normally. Pushes to `main` do not deploy automatically.

The site uses Vinext and Vite, with static HTML and navigation payloads for
`https://jeffry.in/xldx/`. The Pages artifact is `site/dist/client/xldx/`;
Vinext includes the `/xldx` base path in its output directory structure.

<!-- source and test path policies from .fs-lintrc; checks from .legibilityrc and package.json scripts -->

The root library and `site/` are separate projects. Turbo runs their tests and
typechecks as separate tasks. Root lint covers `src/`, `tests/`, scripts, and
TypeScript tool configs; it does not check `site/`.

- Source files: `src/**/{index,utils,types,constants}.ts`.
- Test files: `tests/{unit,integration,e2e}/*/{index,utils}.test.ts`.
- Root-module tests live in `tests/unit/root/`. Browser mocks live in
  `tests/integration/browser/utils.test.ts`.

`bun run lint` feeds every source and test file, including untracked files, to
fs-lint through Legibility. It also runs strict import checks, declaration-order
checks, Oxlint with the agentStrict Legibility preset and a 20-line function
limit, and Oxfmt. Violations fail the command. `bun run lint:fs`,
`bun run lint:imports`, `bun run lint:structure`, and `bun run lint:code` run
individual checks. `bun run lint/session` checks changed files and rejects added
comments during agent sessions.

Source lint also rejects explicit `any`, type assertions, and non-null assertions.

`tsconfig.json` checks the library, tests, scripts, and TypeScript tool configs
without emitting files. `bun run build:types` uses CLI options and the three
library entry points to emit declarations into `dist`. ZIP compatibility tests
also check the original record bytes.

<!-- dependency policy from package.json#codependence and package.json#pastoralist -->

Codependence updates both workspace manifests. The local `xldx` link and the
site's `@tanstack/db` and `idb-keyval` version requirements are held back.
The temporary `basic-ftp` security override is tracked by Pastoralist with its
reason and parent dependency.

## License

Elastic License 2.0
