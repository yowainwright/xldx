import type { Stat } from "./types";
import { Package, Zap, TreeDeciduous } from "lucide-react";

export const CONTENT = {
  heading: "Key statistics",
} as const;

export const STATS: Stat[] = [
  {
    value: "0",
    label: "Dependencies",
    description: "Zero external libraries",
    icon: Package,
  },
  {
    value: "<17KB",
    label: "Minified",
    description: "Tiny bundle size",
    icon: Zap,
  },
  {
    value: "100%",
    label: "Tree-shakeable",
    description: "Import only what you use",
    icon: TreeDeciduous,
  },
];

export const STYLES = {
  section: "px-4 py-16 sm:px-6 lg:px-8",
  list: "mx-auto grid max-w-5xl gap-6 sm:grid-cols-3",
  card: "h-full text-center",
  cardContent: "flex flex-col items-center pt-6",
  icon: "h-8 w-8 text-primary",
  value: "mt-4 text-4xl font-bold",
  label: "mt-1 text-lg font-medium",
  description: "mt-1 text-sm text-muted-foreground",
} as const;
