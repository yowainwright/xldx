import { useState } from "react";
import { TableHead } from "@/components/ui/table";
import { EditableHeader } from "./EditableHeader";
import type { HeaderCellProps } from "./types";

export function HeaderCell({
  columnLetter,
  header,
  editable = true,
  onChange,
}: HeaderCellProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleClick = () => editable && setIsEditing(true);
  const handleBlur = () => setIsEditing(false);
  const handleChange = (v: string) => onChange?.(v);

  const showEditor = editable && isEditing;

  return (
    <TableHead className="sticky top-0 z-10 min-w-[100px] border-r border-border bg-muted text-center">
      <div className="mb-0.5 text-[10px] text-muted-foreground/60">
        {columnLetter}
      </div>
      {showEditor ? (
        <EditableHeader
          value={header}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      ) : (
        <div
          onClick={handleClick}
          className="cursor-pointer truncate font-semibold text-foreground hover:bg-accent/50"
        >
          {header}
        </div>
      )}
    </TableHead>
  );
}

export type { HeaderCellProps } from "./types";
