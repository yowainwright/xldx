import NextLink from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs text-muted-foreground sm:px-6 lg:px-8">
        <p>xldx · Zero-dependency XLSX generation</p>
        <nav aria-label="Footer" className="flex gap-4">
          <NextLink href="/docs" className="hover:text-foreground">
            Docs
          </NextLink>
          <a href="https://www.npmjs.com/package/xldx" className="hover:text-foreground">
            npm
          </a>
          <span>Elastic License 2.0</span>
        </nav>
      </div>
    </footer>
  );
}
