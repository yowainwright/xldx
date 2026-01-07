import type { ReactNode, ComponentType } from "react";

export interface MDXComponentProps {
  children?: ReactNode;
  className?: string;
}

export type CalloutType = "info" | "warning" | "tip";

export interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}

export interface CalloutStyle {
  bg: string;
  border: string;
  icon: string;
}

export type MDXComponentMap = Record<string, ComponentType<MDXComponentProps>>;
