import type { CalloutType } from "./types";
import { Info, TriangleAlert, Lightbulb, Sparkles } from "lucide-react";

export const CALLOUT_ICONS = {
  note: Info,
  warning: TriangleAlert,
  info: Lightbulb,
  tip: Sparkles,
};

export const DEFAULT_CALLOUT_TYPE: CalloutType = "note";
