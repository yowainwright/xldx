"use client";

import { useState } from "react";
import { Header } from "../Header";
import { Sidebar } from "../Sidebar";
import { Footer } from "../Footer";
import type { DocsLayoutProps } from "./types";

export function DocsLayout({ children, frontmatter }: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:pl-64">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          {frontmatter?.title && (
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                {frontmatter.title}
              </h1>
              {frontmatter.description && (
                <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
                  {frontmatter.description}
                </p>
              )}
            </header>
          )}
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            {children}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}

export type { DocsLayoutProps } from "./types";
