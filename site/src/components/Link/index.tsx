import NextLink from "next/link";
import type { LinkProps } from "./types";

export function Link({ href, title, children }: LinkProps) {
  const isExternal = href.startsWith("http");

  if (isExternal) {
    return (
      <a
        href={href}
        title={title}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline-offset-4 hover:underline"
      >
        {children}
      </a>
    );
  }

  return (
    <NextLink href={href} title={title} className="text-primary underline-offset-4 hover:underline">
      {children}
    </NextLink>
  );
}

export type { LinkProps } from "./types";
