import type { SidebarSection } from "./types";

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: "Getting Started",
    items: [
      { label: "Introduction", href: "/docs" },
      { label: "Installation", href: "/docs/installation" },
      { label: "Quick Start", href: "/docs/quick-start" },
      { label: "Comparison", href: "/docs/comparison" },
    ],
  },
  {
    title: "Core Concepts",
    items: [
      { label: "Creating Sheets", href: "/docs/creating-sheets" },
      { label: "Column Definitions", href: "/docs/columns" },
      { label: "Styling", href: "/docs/styling" },
      { label: "Patterns", href: "/docs/patterns" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { label: "Xldx Class", href: "/docs/api/xldx" },
      { label: "Sheet Methods", href: "/docs/api/sheet" },
      { label: "Types", href: "/docs/api/types" },
    ],
  },
  {
    title: "Plugins",
    items: [
      { label: "Overview", href: "/docs/plugins" },
      { label: "Images", href: "/docs/plugins/images" },
      { label: "Comments", href: "/docs/plugins/comments" },
      {
        label: "Conditional Formatting",
        href: "/docs/plugins/conditional-formatting",
      },
      { label: "Validation", href: "/docs/plugins/validation" },
    ],
  },
  {
    title: "Examples",
    items: [
      { label: "Basic Usage", href: "/docs/examples/basic" },
      { label: "Styling Examples", href: "/docs/examples/styling" },
      { label: "Browser Download", href: "/docs/examples/browser" },
      { label: "Node.js Export", href: "/docs/examples/node" },
    ],
  },
];
