import { expect, it } from "bun:test";
import { getDocNavigation, normalizeDocPath } from "../../../src/components/Sidebar/utils";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as runtime from "react/jsx-runtime";
import { evaluate } from "@mdx-js/mdx";
import { mdxOptions } from "../../../mdx.config";

it.each(["/docs/installation/", "/xldx/docs/installation/"])("normalizes %s", (pathname) => {
  expect(normalizeDocPath(pathname)).toBe("/docs/installation");
});

it("derives adjacent pages from the sidebar order", () => {
  const navigation = getDocNavigation("/docs/installation/");
  expect(navigation.current?.label).toBe("Installation");
  expect(navigation.previous?.href).toBe("/docs");
  expect(navigation.next?.href).toBe("/docs/quick-start");
});

it("leaves unknown routes and outer page edges without adjacent links", () => {
  expect(getDocNavigation("/unknown")).toEqual({});
  expect(getDocNavigation("/docs").previous).toBeUndefined();
  expect(getDocNavigation("/docs/quick-start").next).toBeUndefined();
  expect(normalizeDocPath("/xldx-extra/docs/")).toBe("/xldx-extra/docs");
});

it("compiles unique heading IDs with inline code through the site MDX options", async () => {
  const file = new URL("../../fixtures/docs-headings.mdx", import.meta.url);
  const source = await Bun.file(file).text();
  const options = { ...runtime, ...mdxOptions };
  const compiled = await evaluate(source, options);
  const element = createElement(compiled.default);
  const markup = renderToStaticMarkup(element);
  expect(markup).toContain('id="browser-xldx"');
  expect(markup).toContain('id="repeated"');
  expect(markup).toContain('id="repeated-1"');
});
