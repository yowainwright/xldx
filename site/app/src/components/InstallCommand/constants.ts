import type { PackageManager } from "./types";

export const PACKAGE_MANAGERS: PackageManager[] = [
  "npm",
  "bun",
  "pnpm",
  "yarn",
];

export const STORAGE_KEY = "xldx-package-manager";

export const DEFAULT_PACKAGE_MANAGER: PackageManager = "npm";

export const INSTALL_COMMANDS: Record<PackageManager, string> = {
  npm: "npm install",
  bun: "bun add",
  pnpm: "pnpm add",
  yarn: "yarn add",
};
