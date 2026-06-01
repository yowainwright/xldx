import type { DemoTab } from "./types";

export const DEMO_TABS: DemoTab[] = [
  {
    id: "browser",
    label: "Browser",
    description: "Runs directly in your browser, no server needed.",
  },
  {
    id: "worker",
    label: "Web Worker",
    description: "Runs in a background thread, won't block the UI.",
  },
  {
    id: "node",
    label: "Node.js",
    description: "Runs on Cloudflare Workers. Requires GitHub login.",
  },
];

export const WORKER_API_URL = "https://xldx-api.workers.dev";
export const AUTH_STORAGE_KEY = "xldx-demo-auth";
