import type { ReactNode } from "react";

export interface LayoutProps {
  children: ReactNode;
}

export interface DocsLayoutProps {
  children: ReactNode;
  frontmatter?: {
    title?: string;
    description?: string;
  };
}
