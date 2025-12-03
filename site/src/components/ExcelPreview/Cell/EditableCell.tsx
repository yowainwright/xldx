"use client";

import { Input } from "@/components/ui/input";
import type { EditableCellProps } from "./types";

export function EditableCell({ value, onChange, onBlur, onNavigate }: EditableCellProps) {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onBlur();
          onNavigate?.("down");
        } else if (e.key === "Tab") {
          e.preventDefault();
          onBlur();
          onNavigate?.("next");
        }
      }}
      className="h-auto rounded-none border-0 px-1 py-0 text-sm shadow-none ring-1 ring-primary focus-visible:ring-1 focus-visible:ring-primary"
      autoFocus
    />
  );
}
