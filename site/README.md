The xldx site uses Vinext, Vite, and shadcn/ui with its neutral theme.

<!-- homepage behavior from src/components/Spreadsheet -->
The homepage starts with one formula in A1:
`=MID("…bitmap…",SEQUENCE(18,50),1)`. Its results spill across the grid, with
`1` values filled green and `0` values left clear. Editing or clearing A1
recalculates the drawing. Selecting a generated cell shows its source formula;
select A1 to edit it. Each letter uses a 10 × 14 cell area, with two columns
between letters.

<!-- docs layout from src/components/Layout, src/components/Sidebar, src/components/DocsNavigation, and src/components/DocsOutline -->
Documentation has a sticky header. The expandable left navigation stays visible
from 768px, including after Ctrl/Cmd+B; smaller screens use shadcn's Sheet drawer.
Groups can expand and collapse independently. The current page has a
left border. From 1024px, a sticky outline follows the section being read.
Breadcrumbs and previous/next links use the same page order as the left navigation.

## Getting Started

<!-- development commands from ../mise.toml and package.json -->
From the workspace root:

```bash
mise install
mise exec -- bun install
mise exec -- bun run dev
```

Open [http://localhost:4747/xldx/](http://localhost:4747/xldx/). Development
and production use the `/xldx` base path, matching `https://jeffry.in/xldx/`.

Run `mise exec -- bun run --cwd site test` and `mise exec -- bun run --cwd site typecheck` for site checks.
`mise exec -- bun run --cwd site lint:docs` checks the documentation components,
configuration, and tests. Generated shadcn primitives retain upstream conventions.
After a build, `bun run --cwd site test:runtime` checks the static export in
Chromium. Install its browser with `bunx playwright install chromium` first.
Set `RUNTIME_SITE_URL=http://localhost:4747/xldx/` to run the same browser
checks against an already running development server.

Existing `next/*` imports, including `next/font` for Inter, run through Vinext.
`bun run --cwd site dev:next` retains the Next.js development server for comparison.

## Static publishing

<!-- static output and hosting from next.config.ts, vite.config.ts, and ../.github/workflows/gh-pages.yml -->
`bun run build` builds the library first, then exports every site route as HTML
and static navigation payloads. GitHub Pages publishes `site/dist/client/xldx/`.
The directory already contains the `.nojekyll` marker and assets for `/xldx/`.

Vinext compiles MDX through `@mdx-js/rollup`, using `mdx-components.tsx` for
the existing documentation components. Both bundlers use `rehype-slug` to give
headings stable anchors, including numbered duplicates. The outline reads those
anchors from the article. Oxlint and Oxfmt run independently of
the bundler. See the [Vinext documentation](https://vinext.dev/docs).
