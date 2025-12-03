"use client";

import { Input } from "@/components/ui/input";

interface EditableHeaderProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function EditableHeader({ value, onChange, onBlur }: EditableHeaderProps) {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={(e) => e.key === "Enter" && onBlur()}
      className="h-auto rounded-none border-0 px-1 py-0 text-center text-xs font-semibold shadow-none ring-1 ring-primary focus-visible:ring-1 focus-visible:ring-primary"
      autoFocus
    />
  );
}
