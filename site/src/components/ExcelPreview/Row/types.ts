import type { Column } from "../types";

export interface RowProps {
  rowIndex: number;
  rowData: Record<string, unknown>;
  columns: Column[];
  editable?: boolean;
  onCellChange?: (colKey: string, value: string) => void;
  showAddColumnPlaceholder?: boolean;
}
