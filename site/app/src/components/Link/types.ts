import type { ReactNode } from "react";

export interface LinkProps {
  href: string;
  title?: string;
  children: ReactNode;
}
