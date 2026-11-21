"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Header } from "../Header";
import { Sidebar } from "../Sidebar";
import { Footer } from "../Footer";
import { DocsBreadcrumbs, DocsPagination } from "../DocsNavigation";
import { DocsOutline } from "../DocsOutline";
import { getDocNavigation } from "../Sidebar/utils";
import type { DocsLayoutProps } from "./types";

export function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <SidebarProvider open className="flex-col">
      <Header>
        <SidebarTrigger className="md:hidden" />
      </Header>
      <div className="flex w-full flex-1">
        <Sidebar />
        <SidebarInset>
          <DocsArticle>{children}</DocsArticle>
          <Footer />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function DocsArticle({ children }: DocsLayoutProps) {
  const articleRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const navigation = getDocNavigation(pathname);
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-10 px-5 py-8 sm:px-8 sm:py-10 xl:gap-16 xl:px-12">
      <div className="min-w-0 max-w-xl flex-1">
        <DocsBreadcrumbs navigation={navigation} />
        <article ref={articleRef} className="docs-content">
          {children}
        </article>
        <DocsPagination navigation={navigation} />
      </div>
      <DocsOutline articleRef={articleRef} />
    </div>
  );
}

export type { DocsLayoutProps } from "./types";
