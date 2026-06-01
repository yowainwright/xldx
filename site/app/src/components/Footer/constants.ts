import type { FooterSection } from "./types";

export const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "Documentation",
    links: [
      { label: "Getting Started", href: "/docs" },
      { label: "API Reference", href: "/docs/api/xldx" },
      { label: "Examples", href: "/docs/examples/basic" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "GitHub", href: "https://github.com/yowainwright/xldx" },
      { label: "Issues", href: "https://github.com/yowainwright/xldx/issues" },
      { label: "npm", href: "https://www.npmjs.com/package/xldx" },
    ],
  },
];
