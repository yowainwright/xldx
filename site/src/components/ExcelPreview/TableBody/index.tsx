import { TableBody as ShadcnTableBody } from "@/components/ui/table";
import { Row } from "../Row";
import { AddRowButton } from "../AddRowButton";
import type { TableBodyProps } from "./types";

function createCellChangeHandler(
  rowIndex: number,
  onCellChange: (rowIndex: number, colKey: string, value: string) => void
) {
  return (colKey: string, value: string) => onCellChange(rowIndex, colKey, value);
}

export function TableBody({
  data,
  columns,
  editable = true,
  onCellChange,
  onAddRow,
  addRowColSpan,
}: TableBodyProps) {
  const rows = data.map((rowData, rowIndex) => (
    <Row
      key={rowIndex}
      rowIndex={rowIndex}
      rowData={rowData}
      columns={columns}
      editable={editable}
      onCellChange={createCellChangeHandler(rowIndex, onCellChange)}
      showAddColumnPlaceholder={editable}
    />
  ));

  const showAddRow = editable;

  return (
    <ShadcnTableBody>
      {rows}
      {showAddRow && <AddRowButton colSpan={addRowColSpan} onClick={onAddRow} />}
    </ShadcnTableBody>
  );
}

export type { TableBodyProps } from "./types";
