import type { CodeTitleProps } from "./types";

export function CodeTitle({ title }: CodeTitleProps) {
  return (
    <div className="border-b border-border bg-muted px-4 py-2 text-sm text-muted-foreground">
      {title}
    </div>
  );
}

export type { CodeTitleProps } from "./types";
