import type { ComponentType } from "react";
import type { MDXComponentProps, CalloutProps, MDXComponentMap } from "./types";
import { CALLOUT_STYLES, DEFAULT_CALLOUT_TYPE } from "./constants";

export function Callout({
  type = DEFAULT_CALLOUT_TYPE,
  title,
  children,
}: CalloutProps) {
  const styles = CALLOUT_STYLES[type];

  return (
    <div className={`my-6 rounded-lg border p-4 ${styles.bg} ${styles.border}`}>
      <div className="flex gap-3">
        <span className="text-lg">{styles.icon}</span>
        <div className="flex-1">
          {title && <p className="mb-1 font-semibold">{title}</p>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Pre({ children, className }: MDXComponentProps) {
  return (
    <div className="group relative my-6 overflow-hidden rounded-xl border border-border bg-code-background">
      <pre className={className}>{children}</pre>
    </div>
  );
}

export const mdxComponents: MDXComponentMap = {
  pre: Pre,
  Callout: Callout as ComponentType<MDXComponentProps>,
};

export type { MDXComponentProps, CalloutProps, CalloutType } from "./types";
