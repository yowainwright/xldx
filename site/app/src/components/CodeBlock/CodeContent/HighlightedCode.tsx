interface HighlightedCodeProps {
  html: string;
}

export function HighlightedCode({ html }: HighlightedCodeProps) {
  return (
    <div
      className="overflow-x-auto p-4 text-sm text-code-foreground [&>pre]:!bg-transparent [&>pre]:!p-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
