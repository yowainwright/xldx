import type { ReactNode } from "react";

export type CalloutType = "note" | "warning" | "info" | "tip";

export interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}
