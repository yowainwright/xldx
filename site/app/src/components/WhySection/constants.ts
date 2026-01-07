import type { Reason } from "./types";
import { Gauge, Scale, Puzzle, Server } from "lucide-react";

export const CONTENT = {
  heading: "Why xldx?",
  subheading:
    "Existing libraries are bloated, slow, or both. We built xldx because Excel export shouldn't tank your bundle size or block your main thread.",
} as const;

export const REASONS: Reason[] = [
  {
    icon: Gauge,
    title: "Built for speed",
    description:
      "No XML parsing libraries, no heavy abstractions. Direct string concatenation and typed arrays for maximum throughput.",
  },
  {
    icon: Scale,
    title: "Minimal footprint",
    description:
      "Under 17KB minified. Your users don't download megabytes just to export a spreadsheet.",
  },
  {
    icon: Puzzle,
    title: "Plugin architecture",
    description:
      "Core stays lean. Images, charts, validation—add plugins only when you need them.",
  },
  {
    icon: Server,
    title: "Universal runtime",
    description:
      "Same code runs in browsers, Node.js, Bun, Deno, and Cloudflare Workers. No environment-specific builds.",
  },
];

export const STYLES = {
  section: "bg-muted/30 px-4 py-24 sm:px-6 lg:px-8",
  header: "mx-auto max-w-3xl text-center",
  heading: "text-3xl font-bold",
  subheading: "mt-4 text-lg text-muted-foreground",
  list: "mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2",
  card: "h-full",
  cardHeader: "flex-row items-start gap-4",
  iconFigure:
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10",
  icon: "h-5 w-5 text-primary",
  cardTitle: "text-lg",
  description: "text-muted-foreground",
} as const;
