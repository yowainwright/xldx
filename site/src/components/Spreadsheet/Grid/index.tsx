import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { COLUMN_COUNT, DEFAULT_COLOR } from "../constants";
import { columnLabel, spillAt, readDisplay } from "../utils";
import type { GridProps } from "../types";

const columns = Array.from({ length: COLUMN_COUNT }, (_, index) => columnLabel(index));

function ColumnHeaders() {
  const headings = columns.map((column) => (
    <TableHead
      key={column}
      scope="col"
      className="h-7 border-r p-0 text-center text-[10px] text-muted-foreground"
    >
      {column}
    </TableHead>
  ));
  return (
    <TableHeader className="bg-muted/50">
      <TableRow className="hover:bg-transparent">
        <TableHead className="h-7 border-r p-0">
          <span className="sr-only">Row</span>
        </TableHead>
        {headings}
      </TableRow>
    </TableHeader>
  );
}

function GridCell({
  row,
  column,
  value,
  ...props
}: GridProps & { row: number; column: number; value: unknown }) {
  const address = `${columnLabel(column)}${row + 1}`;
  const active = props.selected.row === row && props.selected.column === column;
  const editing = active && props.editing;
  const spill = spillAt(props.spills, row, column);
  const text = readDisplay(value);
  const filled = Boolean(spill) && text === "1";
  const backgroundColor = filled ? DEFAULT_COLOR : undefined;
  const style = { backgroundColor };
  const className = active
    ? "border-r p-0 outline outline-2 -outline-offset-2 outline-primary"
    : "border-r p-0";
  const select = () => props.onSelect(row, column);
  const edit = () => props.onEdit(row, column);
  const pixel = Boolean(spill) && (text === "0" || text === "1");
  const display = pixel ? "" : text;
  return (
    <TableCell style={style} className={className}>
      {editing ? (
        <Input
          autoFocus
          aria-label={`Edit ${address}`}
          value={props.draft}
          onChange={(event) => props.onDraftChange(event.target.value)}
          onBlur={props.onCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") props.onCancel();
          }}
          className="h-7 min-w-0 rounded-none border-0 p-0 text-xs"
        />
      ) : (
        <button
          type="button"
          aria-label={address}
          aria-pressed={active}
          title={display}
          onClick={select}
          onDoubleClick={edit}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== "F2") return;
            event.preventDefault();
            edit();
          }}
          className="block h-7 w-full overflow-hidden text-ellipsis whitespace-nowrap text-left text-[10px]"
        >
          {display}
        </button>
      )}
    </TableCell>
  );
}

function GridRow({ cells, row, ...props }: GridProps & { cells: unknown[]; row: number }) {
  const number = row + 1;
  const content = cells.map((value, column) => {
    return <GridCell key={column} row={row} column={column} value={value} {...props} />;
  });
  return (
    <TableRow className="hover:bg-transparent">
      <TableHead
        scope="row"
        className="h-auto border-r bg-muted/50 p-0 text-center text-[10px] text-muted-foreground"
      >
        {number}
      </TableHead>
      {content}
    </TableRow>
  );
}

export function Grid(props: GridProps) {
  const rows = props.data.map((cells, row) => (
    <GridRow key={row} cells={cells} row={row} {...props} />
  ));
  return (
    <Table
      className="min-w-[760px] table-fixed border-collapse"
      aria-label="Editable spreadsheet cells spelling xldx"
    >
      <ColumnHeaders />
      <TableBody>{rows}</TableBody>
    </Table>
  );
}
