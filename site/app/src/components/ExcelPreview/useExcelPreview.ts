import { useCallback, useMemo } from "react";
import type { Column } from "./types";

interface UseExcelPreviewProps {
  data: Record<string, unknown>[];
  columns: Column[];
  onDataChange?: (data: Record<string, unknown>[]) => void;
  onColumnsChange?: (columns: Column[]) => void;
}

export function useExcelPreview({
  data,
  columns,
  onDataChange,
  onColumnsChange,
}: UseExcelPreviewProps) {
  const handleCellChange = useCallback(
    (rowIndex: number, colKey: string, value: string) => {
      if (!onDataChange) return;
      const newData = data.map((row, i) =>
        i === rowIndex ? { ...row, [colKey]: value } : row,
      );
      onDataChange(newData);
    },
    [data, onDataChange],
  );

  const handleHeaderChange = useCallback(
    (colIndex: number, value: string) => {
      if (!onColumnsChange) return;
      const newColumns = columns.map((col, i) =>
        i === colIndex ? { ...col, header: value } : col,
      );
      onColumnsChange(newColumns);
    },
    [columns, onColumnsChange],
  );

  const handleAddRow = useCallback(() => {
    if (!onDataChange) return;
    const newRow = columns.reduce(
      (acc, col) => ({ ...acc, [col.key]: "" }),
      {} as Record<string, unknown>,
    );
    onDataChange([...data, newRow]);
  }, [data, columns, onDataChange]);

  const handleAddColumn = useCallback(() => {
    if (!onColumnsChange || !onDataChange) return;
    const newKey = `col${columns.length + 1}`;
    const newColumn = { key: newKey, header: `Column ${columns.length + 1}` };
    onColumnsChange([...columns, newColumn]);
    onDataChange(data.map((row) => ({ ...row, [newKey]: "" })));
  }, [columns, data, onColumnsChange, onDataChange]);

  const addRowColSpan = useMemo(() => columns.length + 2, [columns.length]);

  return {
    handleCellChange,
    handleHeaderChange,
    handleAddRow,
    handleAddColumn,
    addRowColSpan,
  };
}
