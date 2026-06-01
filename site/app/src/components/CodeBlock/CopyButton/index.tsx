import type { CopyButtonProps } from "./types";

export function CopyButton({ label, onClick }: CopyButtonProps) {
  return (
    <button
      onClick={onClick}
      className="absolute right-3 top-3 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
    >
      {label}
    </button>
  );
}

export type { CopyButtonProps } from "./types";
