import { TableRow, TableCell } from "@/components/ui/table";
import { Cell } from "../Cell";
import { RowHeader } from "../RowHeader";
import type { RowProps } from "./types";

function createChangeHandler(
  colKey: string,
  onCellChange?: (key: string, value: string) => void,
) {
  return (value: string) => onCellChange?.(colKey, value);
}

export function Row({
  rowIndex,
  rowData,
  columns,
  editable = true,
  onCellChange,
  showAddColumnPlaceholder = false,
}: RowProps) {
  const rowNumber = rowIndex + 1;

  const cells = columns.map((col) => {
    const cellValue = String(rowData[col.key] ?? "");
    const handleChange = createChangeHandler(col.key, onCellChange);

    return (
      <TableCell key={col.key} className="min-w-[100px] border-r border-border">
        <Cell value={cellValue} editable={editable} onChange={handleChange} />
      </TableCell>
    );
  });

  return (
    <TableRow>
      <RowHeader rowNumber={rowNumber} />
      {cells}
      {showAddColumnPlaceholder && <TableCell className="w-8" />}
    </TableRow>
  );
}

export type { RowProps } from "./types";
