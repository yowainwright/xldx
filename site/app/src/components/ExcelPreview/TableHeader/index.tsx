import {
  TableHeader as ShadcnTableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { HeaderCell } from "../HeaderCell";
import { AddColumnButton } from "../AddColumnButton";
import { COLUMN_LETTERS } from "../constants";
import type { TableHeaderProps } from "./types";

function getColumnLetter(index: number): string {
  if (index < 26) return COLUMN_LETTERS[index];
  return (
    COLUMN_LETTERS[Math.floor(index / 26) - 1] + COLUMN_LETTERS[index % 26]
  );
}

function createHeaderChangeHandler(
  colIndex: number,
  onHeaderChange?: (index: number, value: string) => void,
) {
  return (value: string) => onHeaderChange?.(colIndex, value);
}

export function TableHeader({
  columns,
  editable = true,
  onHeaderChange,
  onAddColumn,
}: TableHeaderProps) {
  const headerCells = columns.map((col, colIndex) => (
    <HeaderCell
      key={col.key}
      columnLetter={getColumnLetter(colIndex)}
      header={col.header}
      editable={editable}
      onChange={createHeaderChangeHandler(colIndex, onHeaderChange)}
    />
  ));

  const showAddColumn = editable && onAddColumn;

  return (
    <ShadcnTableHeader>
      <TableRow>
        <TableHead className="sticky left-0 top-0 z-20 w-10 border-r border-border bg-muted text-center" />
        {headerCells}
        {showAddColumn && <AddColumnButton onClick={onAddColumn} />}
      </TableRow>
    </ShadcnTableHeader>
  );
}

export type { TableHeaderProps } from "./types";
