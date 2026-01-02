import { TableCell } from "@/components/ui/table";
import type { RowHeaderProps } from "./types";

export function RowHeader({ rowNumber }: RowHeaderProps) {
  return (
    <TableCell className="sticky left-0 z-10 w-10 border-r border-border bg-muted text-center text-xs font-medium text-muted-foreground">
      {rowNumber}
    </TableCell>
  );
}

export type { RowHeaderProps } from "./types";
