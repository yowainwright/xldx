import { describe, it, expect, beforeEach } from "bun:test";
import {
  setTheme,
  zebraBg,
  bgColorBasedOnDiff,
  colorPerDiff,
  txtColorBasedOnDiff,
  createSetWidthBasedOnCharacterCount,
  customizeInput,
} from "../src/utils";
import { defaultTheme, themes } from "../src/themes";
import type { PatternContext } from "../src/schemas";

describe("Pattern Utility Functions", () => {
  let mockContext: PatternContext;

  beforeEach(() => {
    setTheme(defaultTheme);
    mockContext = {
      rowIndex: 1,
      columnIndex: 0,
      value: "test",
      previousValue: undefined,
      rowData: { id: 1, name: "test" },
      allData: [{ id: 1, name: "test" }],
      columnKey: "name",
    };
  });

  describe("setTheme", () => {
    it("should set theme without error", () => {
      expect(() => setTheme(themes.pastel)).not.toThrow();
      expect(() => setTheme(themes.dark)).not.toThrow();
      expect(() => setTheme(themes.highContrast)).not.toThrow();
    });
  });

  describe("zebraBg", () => {
    it("should return null for odd row indices", () => {
      expect(zebraBg({ ...mockContext, rowIndex: 1 })).toBeNull();
      expect(zebraBg({ ...mockContext, rowIndex: 3 })).toBeNull();
      expect(zebraBg({ ...mockContext, rowIndex: 5 })).toBeNull();
    });

    it("should return fill for even row indices", () => {
      const result = zebraBg({ ...mockContext, rowIndex: 2 });
      expect(result).not.toBeNull();
      expect(result?.fill?.type).toBe("pattern");
      expect(result?.fill?.pattern).toBe("solid");
      expect(result?.fill?.fgColor).toBeDefined();
    });

    it("should use theme color", () => {
      setTheme(themes.pastel);
      const result = zebraBg({ ...mockContext, rowIndex: 2 });
      expect(result?.fill?.fgColor).toBe(themes.pastel.base[100]);
    });
  });

  describe("bgColorBasedOnDiff", () => {
    it("should return null for undefined values", () => {
      const context = { ...mockContext, value: undefined };
      expect(bgColorBasedOnDiff(context)).toBeNull();
    });

    it("should return null for null values", () => {
      const context = { ...mockContext, value: null };
      expect(bgColorBasedOnDiff(context)).toBeNull();
    });

    it("should assign consistent colors to same values", () => {
      const data = [
        { status: "active" },
        { status: "active" },
        { status: "inactive" },
      ];
      
      const context1 = { ...mockContext, value: "active", allData: data, columnKey: "status" };
      const context2 = { ...mockContext, value: "active", allData: data, columnKey: "status" };
      
      const result1 = bgColorBasedOnDiff(context1);
      const result2 = bgColorBasedOnDiff(context2);
      
      expect(result1?.fill?.fgColor).toBe(result2?.fill?.fgColor);
    });

    it("should assign different colors to different values", () => {
      const data = [
        { status: "active" },
        { status: "inactive" },
        { status: "pending" },
      ];
      
      const activeContext = { ...mockContext, value: "active", allData: data, columnKey: "status" };
      const inactiveContext = { ...mockContext, value: "inactive", allData: data, columnKey: "status" };
      const pendingContext = { ...mockContext, value: "pending", allData: data, columnKey: "status" };
      
      const activeResult = bgColorBasedOnDiff(activeContext);
      const inactiveResult = bgColorBasedOnDiff(inactiveContext);
      const pendingResult = bgColorBasedOnDiff(pendingContext);
      
      expect(activeResult?.fill?.fgColor).not.toBe(inactiveResult?.fill?.fgColor);
      expect(activeResult?.fill?.fgColor).not.toBe(pendingResult?.fill?.fgColor);
      expect(inactiveResult?.fill?.fgColor).not.toBe(pendingResult?.fill?.fgColor);
    });

    it("should cycle through available colors", () => {
      const data = Array.from({ length: 10 }, (_, i) => ({ value: `item${i}` }));
      const colors = new Set<string>();
      
      data.forEach((_, index) => {
        const context = { 
          ...mockContext, 
          value: `item${index}`, 
          allData: data, 
          columnKey: "value" 
        };
        const result = bgColorBasedOnDiff(context);
        if (result?.fill?.fgColor) {
          colors.add(result.fill.fgColor);
        }
      });
      
      expect(colors.size).toBeLessThanOrEqual(5);
    });
  });

  describe("colorPerDiff", () => {
    it("should be an alias for bgColorBasedOnDiff", () => {
      expect(colorPerDiff).toBe(bgColorBasedOnDiff);
    });
  });

  describe("txtColorBasedOnDiff", () => {
    it("should return null when no previous value", () => {
      const context = { ...mockContext, previousValue: undefined };
      expect(txtColorBasedOnDiff(context)).toBeNull();
    });

    it("should return null when value unchanged", () => {
      const context = { ...mockContext, value: "same", previousValue: "same" };
      expect(txtColorBasedOnDiff(context)).toBeNull();
    });

    it("should return styled font when value changes", () => {
      const context = { ...mockContext, value: "new", previousValue: "old" };
      const result = txtColorBasedOnDiff(context);
      
      expect(result).not.toBeNull();
      expect(result?.font?.bold).toBe(true);
      expect(result?.font?.color).toBeDefined();
    });

    it("should use theme primary color", () => {
      setTheme(themes.dark);
      const context = { ...mockContext, value: "new", previousValue: "old" };
      const result = txtColorBasedOnDiff(context);
      
      expect(result?.font?.color).toBe(themes.dark.primary);
    });
  });

  describe("createSetWidthBasedOnCharacterCount", () => {
    it("should return null for empty data", () => {
      const setter = createSetWidthBasedOnCharacterCount([]);
      expect(setter()).toBeNull();
    });

    it("should calculate average width by default", () => {
      const data = ["aa", "bbbb", "cccccc"];
      const setter = createSetWidthBasedOnCharacterCount(data, {
        minWidth: 0,
        padding: 0,
        charWidth: 1,
      });
      const result = setter();
      
      expect(result?.width).toBe(4);
    });

    it("should calculate max width", () => {
      const data = ["aa", "bbbb", "cccccc"];
      const setter = createSetWidthBasedOnCharacterCount(data, {
        method: "max",
        minWidth: 0,
        padding: 0,
        charWidth: 1,
      });
      const result = setter();
      
      expect(result?.width).toBe(6);
    });

    it("should calculate median width for odd count", () => {
      const data = ["aa", "bbbb", "cccccc"];
      const setter = createSetWidthBasedOnCharacterCount(data, {
        method: "median",
        minWidth: 0,
        padding: 0,
        charWidth: 1,
      });
      const result = setter();
      
      expect(result?.width).toBe(4);
    });

    it("should calculate median width for even count", () => {
      const data = ["aa", "bbbb", "cccccc", "dddddddd"];
      const setter = createSetWidthBasedOnCharacterCount(data, {
        method: "median",
        minWidth: 0,
        padding: 0,
        charWidth: 1,
      });
      const result = setter();
      
      expect(result?.width).toBe(5);
    });

    it("should respect minWidth", () => {
      const data = ["a"];
      const setter = createSetWidthBasedOnCharacterCount(data, {
        minWidth: 10,
        padding: 0,
        charWidth: 1,
      });
      const result = setter();
      
      expect(result?.width).toBe(10);
    });

    it("should respect maxWidth", () => {
      const data = ["a".repeat(200)];
      const setter = createSetWidthBasedOnCharacterCount(data, {
        maxWidth: 50,
        padding: 0,
        charWidth: 1,
      });
      const result = setter();
      
      expect(result?.width).toBe(50);
    });

    it("should apply padding", () => {
      const data = ["test"];
      const setter = createSetWidthBasedOnCharacterCount(data, {
        minWidth: 0,
        padding: 5,
        charWidth: 1,
      });
      const result = setter();
      
      expect(result?.width).toBe(10);
    });

    it("should apply character width multiplier", () => {
      const data = ["test"];
      const setter = createSetWidthBasedOnCharacterCount(data, {
        minWidth: 0,
        padding: 0,
        charWidth: 2.5,
      });
      const result = setter();
      
      expect(result?.width).toBe(10);
    });

    it("should limit sample size", () => {
      const data = Array(200).fill("test");
      const setter = createSetWidthBasedOnCharacterCount(data, {
        sampleSize: 10,
        minWidth: 0,
        padding: 0,
        charWidth: 1,
      });
      const result = setter();
      
      expect(result?.width).toBe(10);
    });

    it("should set wrapText to true by default", () => {
      const setter = createSetWidthBasedOnCharacterCount(["test"]);
      const result = setter();
      
      expect(result?.wrapText).toBe(true);
    });

    it("should respect wrapText option", () => {
      const setter = createSetWidthBasedOnCharacterCount(["test"], { wrapText: false });
      const result = setter();
      
      expect(result?.wrapText).toBe(false);
    });

    it("should handle null and undefined values", () => {
      const data = [null, undefined, "test", ""];
      const setter = createSetWidthBasedOnCharacterCount(data, {
        minWidth: 0,
        padding: 0,
        charWidth: 1,
      });
      const result = setter();
      
      expect(result?.width).toBe(10);
    });
  });

  describe("customizeInput", () => {
    describe("string matching", () => {
      it("should match exact string", () => {
        const matcher = customizeInput("yes", "✓");
        
        expect(matcher({ ...mockContext, value: "yes" })).not.toBeNull();
        expect(matcher({ ...mockContext, value: "no" })).toBeNull();
        expect(matcher({ ...mockContext, value: "Yes" })).toBeNull();
      });

      it("should return style for match", () => {
        const matcher = customizeInput("active", "✅");
        const result = matcher({ ...mockContext, value: "active" });
        
        expect(result).not.toBeNull();
        expect(result?.font?.color).toBeDefined();
      });
    });

    describe("fastMatch", () => {
      it("should match with case insensitive by default", () => {
        const matcher = customizeInput({ fastMatch: "YES" }, "✓");
        
        expect(matcher({ ...mockContext, value: "yes" })).not.toBeNull();
        expect(matcher({ ...mockContext, value: "YES" })).not.toBeNull();
        expect(matcher({ ...mockContext, value: "Yes" })).not.toBeNull();
      });

      it("should respect case sensitive flag", () => {
        const matcher = customizeInput({ fastMatch: "YES", caseSensitive: true }, "✓");
        
        expect(matcher({ ...mockContext, value: "YES" })).not.toBeNull();
        expect(matcher({ ...mockContext, value: "yes" })).toBeNull();
        expect(matcher({ ...mockContext, value: "Yes" })).toBeNull();
      });
    });

    describe("pattern matching", () => {
      it("should match regex pattern", () => {
        const matcher = customizeInput({ pattern: /^test.*/ }, "matched");
        
        expect(matcher({ ...mockContext, value: "test123" })).not.toBeNull();
        expect(matcher({ ...mockContext, value: "testing" })).not.toBeNull();
        expect(matcher({ ...mockContext, value: "notest" })).toBeNull();
      });

      it("should work with case insensitive regex", () => {
        const matcher = customizeInput({ pattern: /error/i }, "⚠️");
        
        expect(matcher({ ...mockContext, value: "ERROR" })).not.toBeNull();
        expect(matcher({ ...mockContext, value: "Error" })).not.toBeNull();
        expect(matcher({ ...mockContext, value: "error" })).not.toBeNull();
      });
    });

    describe("combined matching", () => {
      it("should require both fastMatch and pattern to match", () => {
        const matcher = customizeInput(
          { 
            fastMatch: "error",
            pattern: /^error$/
          },
          "⚠️"
        );
        
        expect(matcher({ ...mockContext, value: "error" })).not.toBeNull();
        expect(matcher({ ...mockContext, value: "error message" })).toBeNull();
        expect(matcher({ ...mockContext, value: "Error" })).toBeNull();
      });
    });

    describe("edge cases", () => {
      it("should handle non-string match parameter", () => {
        const matcher = customizeInput(null as any, "test");
        expect(matcher(mockContext)).toBeNull();
      });

      it("should handle empty string value", () => {
        const matcher = customizeInput("", "empty");
        expect(matcher({ ...mockContext, value: "" })).not.toBeNull();
        expect(matcher({ ...mockContext, value: "not empty" })).toBeNull();
      });

      it("should handle number values", () => {
        const matcher = customizeInput("123", "number");
        expect(matcher({ ...mockContext, value: 123 })).not.toBeNull();
        expect(matcher({ ...mockContext, value: "123" })).not.toBeNull();
      });
    });
  });
});