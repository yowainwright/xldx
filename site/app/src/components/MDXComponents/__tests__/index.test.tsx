import { describe, it, expect } from "bun:test";
import { Callout, Pre, mdxComponents } from "../index";

describe("MDXComponents", () => {
  describe("Callout", () => {
    it("returns correct styles for info type", () => {
      const result = Callout({ children: "Test content" });
      expect(result).toBeDefined();
      expect(result.props.className).toContain("bg-blue-50");
    });

    it("returns correct styles for warning type", () => {
      const result = Callout({ type: "warning", children: "Warning content" });
      expect(result.props.className).toContain("bg-amber-50");
    });

    it("returns correct styles for tip type", () => {
      const result = Callout({ type: "tip", children: "Tip content" });
      expect(result.props.className).toContain("bg-green-50");
    });
  });

  describe("Pre", () => {
    it("renders pre element wrapper", () => {
      const result = Pre({ children: "const x = 1;" });
      expect(result).toBeDefined();
      expect(result.props.className).toContain("rounded-xl");
    });

    it("passes className to pre element", () => {
      const result = Pre({ children: "code", className: "language-ts" });
      const pre = result.props.children;
      expect(pre.props.className).toBe("language-ts");
    });
  });

  describe("mdxComponents", () => {
    it("exports pre component", () => {
      expect(mdxComponents.pre).toBe(Pre);
    });

    it("exports Callout component", () => {
      expect(mdxComponents.Callout).toBeDefined();
    });
  });
});
