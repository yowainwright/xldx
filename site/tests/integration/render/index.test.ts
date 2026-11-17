import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("../../..", import.meta.url));
const source = `
  import { createElement } from "react";
  import { renderToString } from "react-dom/server";
  import { useQuery } from "@tanstack/react-query";
  import { QueryProvider } from "./src/components/QueryProvider";
  function Page() {
    useQuery({ queryKey: ["static-render"], queryFn: () => [], enabled: false });
    return createElement("p", null, "Rendered");
  }
  renderToString(createElement(QueryProvider, null, createElement(Page)));
`;

test("server rendering exits without waiting for browser cache timers", () => {
  const result = spawnSync(process.execPath, ["-e", source], { cwd, timeout: 2000 });
  expect(result.stderr.toString()).toBe("");
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
});
