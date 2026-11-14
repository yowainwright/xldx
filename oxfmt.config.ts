import { defineConfig } from "oxfmt";

const ignorePatterns = ["site/**", "dist/**", "node_modules/**"];
const files = [".fs-lintrc", ".legibilityrc", ".src-lintrc"];
const language = "json" as const;
const associations = [{ files, language }];
const config = { ignorePatterns, associations };

export default defineConfig(config);
