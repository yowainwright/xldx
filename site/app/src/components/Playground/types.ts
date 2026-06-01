import type { ReactNode } from "react";
import type { Column } from "@/components/ExcelPreview";

export interface PlaygroundProps {
  title?: string;
  children?: ReactNode;
}

export interface PlaygroundData {
  data: Record<string, unknown>[];
  columns: Column[];
}
