"use client";

import { useState } from "react";
import { EditableCell } from "./EditableCell";
import type { CellProps } from "./types";

export function Cell({ value, editable = true, onChange, onNavigate }: CellProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (editable && isEditing) {
    return (
      <EditableCell
        value={value}
        onChange={(v) => onChange?.(v)}
        onBlur={() => setIsEditing(false)}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div
      onClick={() => editable && setIsEditing(true)}
      className="min-h-[20px] cursor-pointer truncate hover:bg-accent/30"
    >
      {value}
    </div>
  );
}

export type { CellProps, EditableCellProps, NavigationDirection } from "./types";
