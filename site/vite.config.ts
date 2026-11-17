import { resolve } from "node:path";
import mdx from "@mdx-js/rollup";
import { defineConfig } from "vite";
import vinext from "vinext";

const providerImportSource = resolve(import.meta.dirname, "mdx-components.tsx");
const enforce = "pre" as const;
const mdxPlugin = { enforce, ...mdx({ providerImportSource }) };
const plugins = [mdxPlugin, vinext()];
const config = { plugins };

export default defineConfig(config);
