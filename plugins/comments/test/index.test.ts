import { describe, it, expect } from "bun:test";
import { commentsPlugin, addComment, groupBySheet } from "../src/index";

describe("commentsPlugin", () => {
  it("should create a plugin with correct name and version", () => {
    const plugin = commentsPlugin();
    expect(plugin.name).toBe("@xldx/comments");
    expect(plugin.version).toBe("0.0.1");
  });

  it("should add and retrieve comments", () => {
    const plugin = commentsPlugin();
    plugin.addComment({ cell: "A1", author: "Test Author", text: "Test comment" });
    plugin.addComment({ cell: "B2", author: "Another Author", text: "Another comment" });

    const comments = plugin.getComments();
    expect(comments).toHaveLength(2);
    expect(comments[0]).toEqual({ cell: "A1", author: "Test Author", text: "Test comment" });
    expect(comments[1]).toEqual({ cell: "B2", author: "Another Author", text: "Another comment" });
  });

  it("should return empty array when no comments", () => {
    const plugin = commentsPlugin();
    expect(plugin.getComments()).toHaveLength(0);
  });

  it("should generate content types for sheets with comments", () => {
    const plugin = commentsPlugin();
    plugin.addComment({ cell: "A1", author: "Author", text: "Text" });

    const contentTypes = plugin.getContentTypes?.() || [];
    expect(contentTypes).toHaveLength(1);
    expect(contentTypes[0]).toContain("comments1.xml");
  });

  it("should return empty content types when no comments", () => {
    const plugin = commentsPlugin();
    const contentTypes = plugin.getContentTypes?.() || [];
    expect(contentTypes).toHaveLength(0);
  });

  it("should generate files in afterGenerate", () => {
    const plugin = commentsPlugin();
    plugin.addComment({ cell: "A1", author: "Author", text: "Comment text" });

    const files = new Map<string, string | Uint8Array>();
    plugin.afterGenerate?.(files);

    expect(files.has("xl/comments1.xml")).toBe(true);
    expect(files.has("xl/drawings/vmlDrawing1.vml")).toBe(true);

    const commentsXml = files.get("xl/comments1.xml") as string;
    expect(commentsXml).toContain("<authors>");
    expect(commentsXml).toContain("Author");
    expect(commentsXml).toContain("Comment text");
  });

  it("should not generate files when no comments", () => {
    const plugin = commentsPlugin();
    const files = new Map<string, string | Uint8Array>();
    plugin.afterGenerate?.(files);

    expect(files.size).toBe(0);
  });

  it("should escape XML special characters", () => {
    const plugin = commentsPlugin();
    plugin.addComment({ cell: "A1", author: "Test & Co", text: "Value < 100" });

    const files = new Map<string, string | Uint8Array>();
    plugin.afterGenerate?.(files);

    const commentsXml = files.get("xl/comments1.xml") as string;
    expect(commentsXml).toContain("Test &amp; Co");
    expect(commentsXml).toContain("Value &lt; 100");
  });
});

describe("addComment helper", () => {
  it("should add comment via helper function", () => {
    const plugin = commentsPlugin();
    addComment(plugin, { cell: "C3", author: "Helper", text: "Via helper" });

    const comments = plugin.getComments();
    expect(comments).toHaveLength(1);
    expect(comments[0].cell).toBe("C3");
  });
});

describe("groupBySheet", () => {
  it("should group items by sheetIndex", () => {
    const items = [
      { sheetIndex: 0, value: "a" },
      { sheetIndex: 1, value: "b" },
      { sheetIndex: 0, value: "c" },
    ];

    const grouped = groupBySheet(items);

    expect(grouped.get(0)).toEqual([
      { sheetIndex: 0, value: "a" },
      { sheetIndex: 0, value: "c" },
    ]);
    expect(grouped.get(1)).toEqual([{ sheetIndex: 1, value: "b" }]);
  });

  it("should handle empty array", () => {
    const grouped = groupBySheet([]);
    expect(grouped.size).toBe(0);
  });
});
