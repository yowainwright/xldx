import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    pre: ({ children }) => {
      const codeElement = children as React.ReactElement<{
        className?: string;
        children?: string;
      }>;
      const className = codeElement?.props?.className || "";
      const language = className.replace("language-", "");
      const code = codeElement?.props?.children || "";

      return <CodeBlock language={language}>{code}</CodeBlock>;
    },
    Callout,
  };
}
