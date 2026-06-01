import { compile } from "@mdx-js/mdx";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from "@shikijs/transformers";

const FRONTMATTER_REGEX = /^---\n[\s\S]*?\n---\n?/;

function stripFrontmatter(source: string): string {
  return source.replace(FRONTMATTER_REGEX, "");
}

export async function compileMDX(source: string) {
  const content = stripFrontmatter(source);
  const compiled = await compile(content, {
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeShiki,
        {
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
          transformers: [
            transformerNotationDiff(),
            transformerNotationHighlight(),
          ],
        },
      ],
    ],
  });

  return String(compiled);
}
