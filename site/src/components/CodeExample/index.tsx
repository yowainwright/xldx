import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { CodeExampleProps } from "./types";

export function CodeExample({ title, description, code, filename }: CodeExampleProps) {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold">{title}</h2>
        {description && (
          <p className="mt-4 text-center text-muted-foreground">{description}</p>
        )}

        <Card className="mt-10 overflow-hidden bg-zinc-900 p-0">
          {filename && (
            <CardHeader className="border-b border-zinc-700 bg-zinc-800 px-4 py-2">
              <span className="text-sm text-zinc-400">{filename}</span>
            </CardHeader>
          )}
          <CardContent className="p-0">
            <pre className="overflow-x-auto p-4 text-sm text-zinc-300">
              <code>{code}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export type { CodeExampleProps } from "./types";
