import { describe, it, expect } from "bun:test";
import {
  defaultTheme,
  pastelTheme,
  darkTheme,
  highContrastTheme,
  themes,
  type ColorTheme,
} from "../src/themes";

describe("Themes", () => {
  const validateTheme = (theme: ColorTheme) => {
    expect(theme.primary).toMatch(/^FF[0-9A-F]{6}$/i);
    expect(theme.secondary).toMatch(/^FF[0-9A-F]{6}$/i);
    expect(theme.success).toMatch(/^FF[0-9A-F]{6}$/i);
    expect(theme.warning).toMatch(/^FF[0-9A-F]{6}$/i);
    expect(theme.error).toMatch(/^FF[0-9A-F]{6}$/i);
    expect(theme.info).toMatch(/^FF[0-9A-F]{6}$/i);

    expect(theme.base).toBeDefined();
    expect(Object.keys(theme.base)).toHaveLength(10);
    Object.values(theme.base).forEach(color => {
      expect(color).toMatch(/^FF[0-9A-F]{6}$/i);
    });

    expect(theme.text).toBeDefined();
    expect(theme.text.primary).toMatch(/^FF[0-9A-F]{6}$/i);
    expect(theme.text.secondary).toMatch(/^FF[0-9A-F]{6}$/i);
    expect(theme.text.disabled).toMatch(/^FF[0-9A-F]{6}$/i);
    expect(theme.text.inverse).toMatch(/^FF[0-9A-F]{6}$/i);

    expect(theme.background).toBeDefined();
    expect(theme.background.default).toMatch(/^FF[0-9A-F]{6}$/i);
    expect(theme.background.paper).toMatch(/^FF[0-9A-F]{6}$/i);
    expect(theme.background.neutral).toMatch(/^FF[0-9A-F]{6}$/i);
  };

  describe("defaultTheme", () => {
    it("should have valid color format", () => {
      validateTheme(defaultTheme);
    });

    it("should have blue primary color", () => {
      expect(defaultTheme.primary).toBe("FF3B82F6");
    });

    it("should have progressive base colors", () => {
      const baseValues = Object.values(defaultTheme.base);
      const isProgressive = baseValues.every((color, index) => {
        if (index === 0) return true;
        const prevColor = baseValues[index - 1];
        return prevColor <= color || prevColor >= color;
      });
      expect(isProgressive).toBe(true);
    });
  });

  describe("pastelTheme", () => {
    it("should have valid color format", () => {
      validateTheme(pastelTheme);
    });

    it("should have softer colors", () => {
      expect(pastelTheme.primary).toBe("FFBFDBFE");
      expect(pastelTheme.error).toBe("FFFECACA");
    });
  });

  describe("darkTheme", () => {
    it("should have valid color format", () => {
      validateTheme(darkTheme);
    });

    it("should have dark background colors", () => {
      expect(darkTheme.background.default).toBe("FF09090B");
      expect(darkTheme.background.paper).toBe("FF18181B");
    });

    it("should have light text colors", () => {
      expect(darkTheme.text.primary).toBe("FFF4F4F5");
      expect(darkTheme.text.inverse).toBe("FF18181B");
    });
  });

  describe("highContrastTheme", () => {
    it("should have valid color format", () => {
      validateTheme(highContrastTheme);
    });

    it("should have high contrast colors", () => {
      expect(highContrastTheme.primary).toBe("FF0000FF");
      expect(highContrastTheme.error).toBe("FFFF0000");
      expect(highContrastTheme.success).toBe("FF008000");
    });

    it("should have pure black and white in base", () => {
      expect(highContrastTheme.base[50]).toBe("FFFFFFFF");
      expect(highContrastTheme.base[900]).toBe("FF000000");
    });
  });

  describe("themes object", () => {
    it("should contain all themes", () => {
      expect(themes.default).toBe(defaultTheme);
      expect(themes.pastel).toBe(pastelTheme);
      expect(themes.dark).toBe(darkTheme);
      expect(themes.highContrast).toBe(highContrastTheme);
    });

    it("should have exactly 4 themes", () => {
      expect(Object.keys(themes)).toHaveLength(4);
    });
  });

  describe("theme compatibility", () => {
    it("all themes should have same structure", () => {
      const themeKeys = Object.keys(defaultTheme);
      
      Object.values(themes).forEach(theme => {
        expect(Object.keys(theme)).toEqual(themeKeys);
        expect(Object.keys(theme.base)).toEqual(Object.keys(defaultTheme.base));
        expect(Object.keys(theme.text)).toEqual(Object.keys(defaultTheme.text));
        expect(Object.keys(theme.background)).toEqual(Object.keys(defaultTheme.background));
      });
    });
  });
});