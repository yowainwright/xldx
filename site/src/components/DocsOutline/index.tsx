"use client";

import { useEffect, useState, type RefObject } from "react";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { observeDocHeadings, readDocHeadings } from "./utils";
import type { DocHeading } from "./types";

export function DocsOutline({ articleRef }: { articleRef: RefObject<HTMLElement | null> }) {
  const { headings, activeId } = useOutline(articleRef);
  if (!headings.length) return null;
  const links = headings.map((heading) => {
    const active = heading.id === activeId;
    return <OutlineLink key={heading.id} heading={heading} active={active} />;
  });
  return (
    <aside className="hidden w-44 shrink-0 lg:block xl:w-48">
      <nav aria-label="On this page" className="sticky top-24">
        <p className="mb-4 text-xs font-semibold text-foreground">On this page</p>
        <ul className="space-y-1 border-l">{links}</ul>
      </nav>
    </aside>
  );
}

function useOutline(articleRef: RefObject<HTMLElement | null>) {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<DocHeading[]>([]);
  const [activeId, setActiveId] = useState("");
  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;
    setHeadings(readDocHeadings(article));
    const cleanup = observeDocHeadings(article, setActiveId);
    return cleanup;
  }, [articleRef, pathname]);
  const outline = { headings, activeId };
  return outline;
}

function OutlineLink({ heading, active }: { heading: DocHeading; active: boolean }) {
  const current = active ? "location" : undefined;
  const state = active
    ? "border-foreground text-foreground"
    : "border-transparent text-muted-foreground hover:text-foreground";
  const nested = heading.depth === 3;
  const className = cn(
    "-ml-px block border-l py-1.5 pl-4 text-xs leading-5 transition-colors",
    state,
    nested && "pl-7",
  );
  const href = `#${heading.id}`;
  return (
    <li>
      <a href={href} aria-current={current} className={className}>
        {heading.text}
      </a>
    </li>
  );
}
