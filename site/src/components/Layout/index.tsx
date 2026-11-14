"use client";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Header } from "../Header";
import { Sidebar } from "../Sidebar";
import { Footer } from "../Footer";
import type { DocsLayoutProps } from "./types";

export function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset>
        <Header>
          <SidebarTrigger />
        </Header>
        <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
          <article className="docs-content">{children}</article>
        </div>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}

export type { DocsLayoutProps } from "./types";
