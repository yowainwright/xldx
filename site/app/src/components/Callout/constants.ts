import type { CalloutType } from "./types";

export const CALLOUT_STYLES: Record<
  CalloutType,
  { bg: string; border: string; icon: string }
> = {
  note: {
    bg: "bg-blue-50 dark:bg-blue-950/50",
    border: "border-blue-200 dark:border-blue-800",
    icon: "ℹ️",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800",
    icon: "⚠️",
  },
  info: {
    bg: "bg-sky-50 dark:bg-sky-950/50",
    border: "border-sky-200 dark:border-sky-800",
    icon: "💡",
  },
  tip: {
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "✨",
  },
};

export const DEFAULT_CALLOUT_TYPE: CalloutType = "note";
