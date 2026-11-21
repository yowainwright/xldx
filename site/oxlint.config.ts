import { defineConfig, type OxlintConfig } from "oxlint";
import legibility from "oxlint-plugin-legibility";

const { jsPlugins, rules } = legibility.configs.agentStrict;
const functionOptions = { max: 20, skipBlankLines: true, skipComments: true };
const functionRule: ["error", typeof functionOptions] = ["error", functionOptions];
const assertionOptions: { assertionStyle: "never" } = { assertionStyle: "never" };
const assertionRule: ["error", typeof assertionOptions] = ["error", assertionOptions];
const docsRules: OxlintConfig["rules"] = {
  ...rules,
  "max-lines-per-function": functionRule,
  "typescript/no-explicit-any": "error",
  "typescript/no-non-null-assertion": "error",
  "typescript/consistent-type-assertions": assertionRule,
};
const ignorePatterns = ["**/components/ui/**"];
const config = defineConfig({
  jsPlugins,
  rules: docsRules,
  ignorePatterns,
});

export default config;
