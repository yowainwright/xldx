export interface Column {
  key: string;
  header: string;
}

export interface ExcelPreviewProps {
  data: Record<string, unknown>[];
  columns: Column[];
  onDataChange?: (data: Record<string, unknown>[]) => void;
  onColumnsChange?: (columns: Column[]) => void;
  editable?: boolean;
}

export interface CellPosition {
  row: number;
  col: number;
}
