import { resolve } from "node:path";
import mdx from "@mdx-js/rollup";
import { defineConfig } from "vite";
import vinext from "vinext";
import { mdxOptions } from "./mdx.config";

const providerImportSource = resolve(import.meta.dirname, "mdx-components.tsx");
const enforce = "pre" as const;
const options = { ...mdxOptions, providerImportSource };
const mdxPlugin = { enforce, ...mdx(options) };
const plugins = [mdxPlugin, vinext()];
const config = { plugins };

export default defineConfig(config);
