import { defineConfig } from "playwright/test";

const runningServer = process.env.RUNTIME_SITE_URL;
const baseURL = runningServer ?? "http://127.0.0.1:4748/xldx/";
const hostname = new URL(baseURL).hostname;
const localServer = ["localhost", "127.0.0.1"].includes(hostname);
if (!localServer) throw new Error("Runtime tests require a local server");
const command = "python3 -m http.server 4748 --bind 127.0.0.1 --directory dist/client";
const webServer = runningServer ? undefined : { command, url: baseURL };
const use = { baseURL };
const config = { testDir: "./tests/e2e", testMatch: "**/*.e2e.ts", workers: 1, use, webServer };

export default defineConfig(config);
