"use client";

import NextLink from "next/link";
import { GitBranch, Table2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { normalizeDocPath } from "../Sidebar/utils";
import { NAV_ITEMS, GITHUB_URL } from "./constants";
import type { HeaderProps, NavItem } from "./types";

export function Header({ children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b bg-background/95 backdrop-blur">
      <div className="flex h-16 w-full items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {children}
          <Brand />
        </div>
        <div className="flex items-center gap-2 sm:gap-7">
          <Navigation />
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}

function Brand() {
  return (
    <NextLink href="/" aria-label="xldx home" className="flex items-center gap-2.5">
      <span className="hidden size-8 items-center justify-center rounded-lg border bg-muted/40 sm:flex">
        <Table2 className="size-4" aria-hidden="true" />
      </span>
      <span className="font-mono text-xl font-semibold tracking-tight">xldx</span>
    </NextLink>
  );
}

function Navigation() {
  const route = usePathname();
  const pathname = normalizeDocPath(route);
  const links = NAV_ITEMS.map((item) => (
    <NavigationLink key={item.href} item={item} pathname={pathname} />
  ));
  return (
    <nav
      aria-label="Main navigation"
      className="flex items-center gap-2 text-xs font-medium sm:gap-6 sm:text-sm"
    >
      {links}
    </nav>
  );
}

function NavigationLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const docsLink = item.href === "/docs";
  const exact = pathname === item.href;
  const docsChild = docsLink && pathname.startsWith("/docs/");
  const active = exact || docsChild;
  const current = exact ? "page" : undefined;
  const className = active ? "text-foreground" : "text-muted-foreground hover:text-foreground";
  return (
    <NextLink href={item.href} aria-current={current} className={className}>
      {item.label}
    </NextLink>
  );
}

function HeaderActions() {
  return (
    <div className="flex items-center gap-1 border-l pl-2 sm:pl-5">
      <ThemeToggle />
      <Button variant="ghost" size="icon" asChild>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <GitBranch className="size-4" />
        </a>
      </Button>
    </div>
  );
}

export type { HeaderProps } from "./types";
