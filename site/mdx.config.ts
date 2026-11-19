import rehypeSlug from "rehype-slug";

const rehypePlugins = [rehypeSlug];
export const mdxOptions = { rehypePlugins };
const pluginNames = ["rehype-slug"];
export const nextMdxOptions = { rehypePlugins: pluginNames };
