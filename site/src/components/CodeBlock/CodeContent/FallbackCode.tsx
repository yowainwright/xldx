interface FallbackCodeProps {
  code: string;
}

export function FallbackCode({ code }: FallbackCodeProps) {
  return (
    <pre className="overflow-x-auto p-4 text-sm text-code-foreground">
      <code>{code}</code>
    </pre>
  );
}
