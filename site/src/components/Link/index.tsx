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
        className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
      >
        {children}
      </a>
    );
  }

  return (
    <NextLink
      href={href}
      title={title}
      className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
    >
      {children}
    </NextLink>
  );
}

export type { LinkProps } from "./types";
