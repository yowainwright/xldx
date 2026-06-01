import type { Column } from "../types";

export interface TableHeaderProps {
  columns: Column[];
  editable?: boolean;
  onHeaderChange?: (colIndex: number, value: string) => void;
  onAddColumn?: () => void;
}
