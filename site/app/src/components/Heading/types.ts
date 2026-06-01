import type { ReactNode } from "react";

export interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  id?: string;
  children: ReactNode;
}
