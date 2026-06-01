export type PackageManager = "npm" | "bun" | "pnpm" | "yarn";

export interface InstallCommandProps {
  packageName: string;
}
