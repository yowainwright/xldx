import { TableRow, TableCell } from "@/components/ui/table";
import type { AddRowButtonProps } from "./types";

export function AddRowButton({ colSpan, onClick }: AddRowButtonProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="bg-muted/50">
        <button
          onClick={onClick}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          + Add row
        </button>
      </TableCell>
    </TableRow>
  );
}

export type { AddRowButtonProps } from "./types";
