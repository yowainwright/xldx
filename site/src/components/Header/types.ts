import type { ReactNode } from "react";

export interface HeaderProps {
  children?: ReactNode;
}

export interface NavItem {
  label: string;
  href: string;
}
