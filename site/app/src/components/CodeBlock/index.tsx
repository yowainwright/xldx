import { CodeTitle } from "./CodeTitle";
import { CopyButton } from "./CopyButton";
import { CodeContent } from "./CodeContent";
import { useCodeBlock } from "./useCodeBlock";
import { DEFAULT_LANGUAGE } from "./constants";
import type { CodeBlockProps } from "./types";

export function CodeBlock({
  children,
  language = DEFAULT_LANGUAGE,
  title,
}: CodeBlockProps) {
  const { html, isHighlighted, handleCopy, copyButtonLabel } = useCodeBlock({
    code: children,
    language,
  });

  const showTitle = Boolean(title);

  return (
    <div className="group relative my-6 overflow-hidden rounded-xl border border-border bg-code-background">
      {showTitle && <CodeTitle title={title!} />}
      <div className="relative">
        <CopyButton label={copyButtonLabel} onClick={handleCopy} />
        <CodeContent
          html={html}
          fallback={children}
          isHighlighted={isHighlighted}
        />
      </div>
    </div>
  );
}

export type { CodeBlockProps } from "./types";
