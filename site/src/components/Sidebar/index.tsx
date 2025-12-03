"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { SIDEBAR_SECTIONS } from "./constants";
import type { SidebarProps } from "./types";
import clsx from "clsx";

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r border-zinc-200 bg-white transition-transform dark:border-zinc-800 dark:bg-zinc-950 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>

        <nav className="p-4">
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <NextLink
                      href={item.href}
                      onClick={onClose}
                      className={clsx(
                        "block rounded-md px-3 py-2 text-sm transition-colors",
                        pathname === item.href
                          ? "bg-sky-50 font-medium text-sky-600 dark:bg-sky-950 dark:text-sky-400"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                      )}
                    >
                      {item.label}
                    </NextLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

export type { SidebarProps, SidebarSection, SidebarItem } from "./types";
