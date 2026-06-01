import { useEffect, useState, useCallback } from "react";
import { useTheme } from "@/hooks/useTheme";
import type { BundledLanguage } from "shiki";
import { LIGHT_THEME, DARK_THEME, COPY_TIMEOUT_MS } from "./constants";

interface UseCodeBlockProps {
  code: string;
  language: string;
}

export function useCodeBlock({ code, language }: UseCodeBlockProps) {
  const [html, setHtml] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    async function highlight() {
      const { codeToHtml } = await import("shiki");
      const theme = resolvedTheme === "dark" ? DARK_THEME : LIGHT_THEME;
      const highlighted = await codeToHtml(code.trim(), {
        lang: language as BundledLanguage,
        theme,
      });
      setHtml(highlighted);
    }
    highlight();
  }, [code, language, resolvedTheme]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_TIMEOUT_MS);
  }, [code]);

  const isHighlighted = Boolean(html);
  const copyButtonLabel = copied ? "Copied!" : "Copy";

  return {
    html,
    isHighlighted,
    handleCopy,
    copyButtonLabel,
  };
}
