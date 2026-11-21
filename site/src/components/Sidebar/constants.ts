import type { SidebarItem, SidebarSection } from "./types";

const gettingStarted: SidebarItem[] = [
  { label: "Introduction", href: "/docs" },
  { label: "Installation", href: "/docs/installation" },
  { label: "Quick Start", href: "/docs/quick-start" },
];

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: "Getting Started",
    items: gettingStarted,
  },
];
