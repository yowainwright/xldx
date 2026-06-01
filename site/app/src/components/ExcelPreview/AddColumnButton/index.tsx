import { TableHead } from "@/components/ui/table";
import type { AddColumnButtonProps } from "./types";

export function AddColumnButton({ onClick }: AddColumnButtonProps) {
  return (
    <TableHead className="sticky top-0 z-10 w-8 bg-muted">
      <button
        onClick={onClick}
        className="flex h-full w-full items-center justify-center text-muted-foreground hover:text-foreground"
        title="Add column"
      >
        +
      </button>
    </TableHead>
  );
}

export type { AddColumnButtonProps } from "./types";
