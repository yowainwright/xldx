The xldx site uses Next.js and shadcn/ui with its neutral theme.

<!-- homepage behavior from src/components/Spreadsheet -->
The homepage renders colored cells spelling `xldx`. Enter `=XLDX("#10b981")`
in the formula bar to change the fill color. Each letter uses a 10 × 14 cell
area, with two columns between letters. Documentation uses shadcn's Sidebar.

## Getting Started

<!-- development commands from ../mise.toml and package.json -->
From the workspace root:

```bash
mise install
mise exec -- bun install
mise exec -- bun run dev
```

Open [http://localhost:4747](http://localhost:4747). Production builds use
the `/xldx` base path for GitHub Pages.

Run `mise exec -- bun run --cwd site test` and `mise exec -- bun run --cwd site typecheck` for site checks.

This project uses `next/font` to load Inter.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
