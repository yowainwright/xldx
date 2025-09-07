import { resolveDocsUrl } from "../utils/urlResolver";

const SIDEBAR = [
  {
    title: "Getting Started",
    items: [
      {
        title: "Introduction",
        href: resolveDocsUrl("introduction"),
      },
      {
        title: "Setup",
        href: resolveDocsUrl("setup"),
      },
      {
        title: "API Reference",
        href: resolveDocsUrl("api-reference"),
      },
    ],
  },
];

export default SIDEBAR;