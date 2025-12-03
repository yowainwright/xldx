import NextLink from "next/link";
import type { QuickLinksProps, QuickLinkProps } from "./types";

export function QuickLinks({ children }: QuickLinksProps) {
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {children}
    </div>
  );
}

export function QuickLink({ title, description, href, icon }: QuickLinkProps) {
  return (
    <NextLink
      href={href}
      className="group rounded-xl border border-zinc-200 p-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
    >
      {icon && <span className="mb-2 block text-2xl">{icon}</span>}
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </NextLink>
  );
}

export type { QuickLinksProps, QuickLinkProps } from "./types";
