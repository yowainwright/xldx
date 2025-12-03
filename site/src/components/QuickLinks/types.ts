import type { ReactNode } from "react";

export interface QuickLinksProps {
  children: ReactNode;
}

export interface QuickLinkProps {
  title: string;
  description: string;
  href: string;
  icon?: string;
}
