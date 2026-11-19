import { SIDEBAR_SECTIONS } from "./constants";
import type { DocNavigation } from "./types";

export function getDocNavigation(pathname: string): DocNavigation {
  const path = normalizeDocPath(pathname);
  const pages = SIDEBAR_SECTIONS.flatMap((section) => section.items);
  const index = pages.findIndex((page) => page.href === path);
  const empty: DocNavigation = {};
  if (index === -1) return empty;
  const current = pages[index];
  const previous = pages[index - 1];
  const next = pages[index + 1];
  const navigation = { current, previous, next };
  return navigation;
}

export function normalizeDocPath(pathname: string): string {
  const path = pathname.replace(/^\/xldx(?=\/|$)/, "");
  const normalized = path.replace(/\/+$/, "") || "/";
  return normalized;
}
