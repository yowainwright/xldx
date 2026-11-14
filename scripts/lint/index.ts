import { spawnSync, type StdioOptions } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const hasLegacyTests = existsSync("test");
const roots = ["src", "tests"].concat(hasLegacyTests ? ["test"] : []);
const paths = roots.flatMap(listFiles);
const input = paths.join("\0") + "\0";
const args = ["--config", ".legibilityrc"].concat(process.argv.slice(2));
const stdio: StdioOptions = ["pipe", "inherit", "inherit"];
const result = spawnSync("./node_modules/.bin/legibility", args, {
  input,
  stdio,
});
if (result.error) throw result.error;
process.exit(result.status ?? 2);

function listFiles(root: string): string[] {
  const entries = readdirSync(root, { recursive: true, withFileTypes: true });
  const paths = entries
    .filter((entry) => !entry.isDirectory())
    .map((entry) => join(entry.parentPath, entry.name));
  return paths;
}
