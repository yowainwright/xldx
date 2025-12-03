import { HighlightedCode } from "./HighlightedCode";
import { FallbackCode } from "./FallbackCode";
import type { CodeContentProps } from "./types";

export function CodeContent({ html, fallback, isHighlighted }: CodeContentProps) {
  if (isHighlighted) {
    return <HighlightedCode html={html} />;
  }
  return <FallbackCode code={fallback} />;
}

export type { CodeContentProps } from "./types";
