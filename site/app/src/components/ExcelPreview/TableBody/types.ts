import type { Column } from "../types";

export interface TableBodyProps {
  data: Record<string, unknown>[];
  columns: Column[];
  editable?: boolean;
  onCellChange: (rowIndex: number, colKey: string, value: string) => void;
  onAddRow: () => void;
  addRowColSpan: number;
}
