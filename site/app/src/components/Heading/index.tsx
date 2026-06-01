import type { HeadingProps } from "./types";
import { HEADING_STYLES } from "./constants";

export function Heading({ level, id, children }: HeadingProps) {
  const Tag = `h${level}` as const;
  const styles = HEADING_STYLES[level];

  return (
    <Tag id={id} className={`group scroll-mt-24 ${styles}`}>
      {children}
      {id && (
        <a
          href={`#${id}`}
          className="ml-2 text-zinc-400 opacity-0 transition-opacity hover:text-zinc-600 group-hover:opacity-100"
          aria-label={`Link to ${id}`}
        >
          #
        </a>
      )}
    </Tag>
  );
}

export type { HeadingProps } from "./types";
