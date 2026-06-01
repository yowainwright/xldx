import { CodeBlock } from "@/components/CodeBlock";
import { ExcelPreview } from "@/components/ExcelPreview";
import type { CodeExampleProps } from "./types";

export function CodeExample({
  title,
  description,
  code,
  filename,
  excelPreview,
}: CodeExampleProps) {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold">{title}</h2>
        {description && (
          <p className="mt-4 text-center text-muted-foreground">
            {description}
          </p>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <CodeBlock language="typescript" title={filename}>
            {code}
          </CodeBlock>

          {excelPreview && (
            <div className="flex flex-col">
              <div className="mb-2 text-sm text-muted-foreground">Output</div>
              <ExcelPreview
                data={excelPreview.rows}
                columns={excelPreview.columns}
                editable={false}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export type { CodeExampleProps, ExcelData } from "./types";
