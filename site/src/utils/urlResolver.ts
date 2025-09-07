export function resolveUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  if (path === "") {
    return base.endsWith("/") ? base.slice(0, -1) : base;
  }
  const normalizedBase = base.endsWith("/") ? base : base + "/";
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return normalizedBase + normalizedPath;
}

export function resolveDocsUrl(slug: string): string {
  return resolveUrl(`docs/${slug}`);
}
