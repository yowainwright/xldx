import type { CalloutType, CalloutStyle } from "./types";

export const DEFAULT_CALLOUT_TYPE: CalloutType = "info";

export const CALLOUT_STYLES: Record<CalloutType, CalloutStyle> = {
  info: {
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-200 dark:border-blue-800",
    icon: "ℹ️",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950",
    border: "border-amber-200 dark:border-amber-800",
    icon: "⚠️",
  },
  tip: {
    bg: "bg-green-50 dark:bg-green-950",
    border: "border-green-200 dark:border-green-800",
    icon: "💡",
  },
};
