import { expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";

const allowedPaths = [
  "src/index.ts",
  "src/utils.ts",
  "src/types.ts",
  "src/constants.ts",
  "src/nested/module/index.ts",
  "tests/unit/sheet/index.test.ts",
  "tests/integration/browser/utils.test.ts",
  "tests/e2e/download/index.test.ts",
  "site/src/app/page.tsx",
];
const deniedPaths = [
  "src/helper.ts",
  "src/index.tsx",
  "src/index.test.ts",
  "src/module/schema.ts",
  "tests/unit/index.test.ts",
  "tests/unit/sheet/types.test.ts",
  "tests/unit/sheet/utils.ts",
  "tests/unit/sheet/nested/index.test.ts",
  "tests/sheet/index.test.ts",
  "tests/other/sheet/index.test.ts",
  "test/sheet.test.ts",
];
const unsafeTypes = [
  ["no-explicit-any", "export const value: any = 1;"],
  ["consistent-type-assertions", "export const value = 1 as number;"],
  ["no-non-null-assertion", "const values: number[] = []; export const value = values[0]!;"],
];

it.each(unsafeTypes)("rejects %s in source", (rule, input) => {
  const path = "src/.type-policy-rejection.ts";
  writeFileSync(path, input, { flag: "wx" });
  try {
    const args = ["node_modules/oxlint/bin/oxlint", "--config", "oxlint.config.ts", path];
    const result = spawnSync("node", args, { encoding: "utf8" });
    const output = result.stdout + result.stderr;
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(output).toContain(rule);
  } finally {
    unlinkSync(path);
  }
});

it.each(allowedPaths)("allows %s", (path) => {
  const result = spawnSync("fs-lint", ["check-path", path]);
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
});

it.each(deniedPaths)("rejects %s", (path) => {
  const result = spawnSync("fs-lint", ["check-path", path]);
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(1);
});

it("includes untracked files in the full-tree filename check", () => {
  const path = "src/.lint-policy-rejection.txt";
  writeFileSync(path, "", { flag: "wx" });
  try {
    const args = ["scripts/lint/index.ts", "--linter", "fs-lint"];
    const result = spawnSync(process.execPath, args, { encoding: "utf8" });
    const output = result.stdout + result.stderr;
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(output).toContain(path);
  } finally {
    unlinkSync(path);
  }
});
