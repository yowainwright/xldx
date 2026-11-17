"use client";

import NextLink from "next/link";
import { GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NAV_ITEMS, GITHUB_URL } from "./constants";
import type { HeaderProps } from "./types";

export function Header({ children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {children}

          <NextLink href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground">xldx</span>
          </NextLink>
        </div>

        <nav aria-label="Main navigation" className="flex items-center gap-3 sm:gap-6">
          {NAV_ITEMS.map((item) => (
            <NextLink
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              {...(item.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {item.label}
            </NextLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <GitBranch className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

export type { HeaderProps } from "./types";
