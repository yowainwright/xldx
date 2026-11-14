import { defineConfig } from "oxlint";
import legibility from "oxlint-plugin-legibility";

const filenameSchema = { schema: "index", minDepth: 1 } as const;
const functionLimit = {
  max: 20,
  skipBlankLines: true,
  skipComments: true,
  IIFEs: true,
};
const filenameRule = ["error", filenameSchema] as const;
const functionRule = ["error", functionLimit] as const;
const projectRules = {
  "legibility/require-filename-matches-dirname": filenameRule,
  "max-lines-per-function": functionRule,
};
const rules = Object.assign({}, legibility.configs.agentStrict.rules, projectRules);
const { jsPlugins } = legibility.configs.agentStrict;
const ignorePatterns = ["site/**", "dist/**", "node_modules/**"];
const assertionOptions = { assertionStyle: "never" } as const;
const assertionRule: ["error", typeof assertionOptions] = ["error", assertionOptions];
const sourceRules = {
  "typescript/no-explicit-any": "error",
  "typescript/no-non-null-assertion": "error",
  "typescript/consistent-type-assertions": assertionRule,
} as const;
const sourceFiles = ["src/**/*.ts"];
const overrides = [{ files: sourceFiles, rules: sourceRules }];
const config = { jsPlugins, rules, ignorePatterns, overrides };

export default defineConfig(config);
