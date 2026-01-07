import { describe, it, expect } from "bun:test";
import { imagesPlugin, addImage } from "../src/index";
import pkg from "../package.json";

describe("imagesPlugin", () => {
  it("should create a plugin with correct name and version", () => {
    const plugin = imagesPlugin();
    expect(plugin.name).toBe(pkg.name);
    expect(plugin.version).toBe(pkg.version);
  });

  it("should add and retrieve images", () => {
    const plugin = imagesPlugin();
    const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

    plugin.addImage({
      cell: "A1",
      image: imageData,
      width: 100,
      height: 50,
    });

    const images = plugin.getImages();
    expect(images).toHaveLength(1);
    expect(images[0].cell).toBe("A1");
    expect(images[0].width).toBe(100);
    expect(images[0].height).toBe(50);
    expect(images[0].type).toBe("png");
  });

  it("should detect PNG image type", () => {
    const plugin = imagesPlugin();
    const pngData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

    plugin.addImage({ cell: "A1", image: pngData, width: 100, height: 100 });

    expect(plugin.getImages()[0].type).toBe("png");
  });

  it("should detect JPEG image type", () => {
    const plugin = imagesPlugin();
    const jpegData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

    plugin.addImage({ cell: "A1", image: jpegData, width: 100, height: 100 });

    expect(plugin.getImages()[0].type).toBe("jpeg");
  });

  it("should detect GIF image type", () => {
    const plugin = imagesPlugin();
    const gifData = new Uint8Array([0x47, 0x49, 0x46, 0x38]);

    plugin.addImage({ cell: "A1", image: gifData, width: 100, height: 100 });

    expect(plugin.getImages()[0].type).toBe("gif");
  });

  it("should use explicit image type when provided", () => {
    const plugin = imagesPlugin();
    const data = new Uint8Array([0x00, 0x00, 0x00, 0x00]);

    plugin.addImage({
      cell: "A1",
      image: data,
      width: 100,
      height: 100,
      type: "jpeg",
    });

    expect(plugin.getImages()[0].type).toBe("jpeg");
  });

  it("should generate content types for images", () => {
    const plugin = imagesPlugin();
    const pngData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

    plugin.addImage({ cell: "A1", image: pngData, width: 100, height: 100 });

    const contentTypes = plugin.getContentTypes?.() || [];
    expect(contentTypes.length).toBeGreaterThan(0);
    expect(contentTypes.some((t) => t.includes("image/png"))).toBe(true);
    expect(contentTypes.some((t) => t.includes("drawing"))).toBe(true);
  });

  it("should return empty content types when no images", () => {
    const plugin = imagesPlugin();
    const contentTypes = plugin.getContentTypes?.() || [];
    expect(contentTypes).toHaveLength(0);
  });

  it("should generate files in afterGenerate", () => {
    const plugin = imagesPlugin();
    const pngData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

    plugin.addImage({ cell: "B2", image: pngData, width: 200, height: 150 });

    const files = new Map<string, string | Uint8Array>();
    files.set(
      "xl/worksheets/sheet1.xml",
      '<?xml version="1.0"?><worksheet></worksheet>',
    );

    plugin.afterGenerate?.(files);

    expect(files.has("xl/drawings/drawing1.xml")).toBe(true);
    expect(files.has("xl/drawings/_rels/drawing1.xml.rels")).toBe(true);
    expect(files.has("xl/media/image1.png")).toBe(true);

    const drawingXml = files.get("xl/drawings/drawing1.xml") as string;
    expect(drawingXml).toContain("xdr:twoCellAnchor");
    expect(drawingXml).toContain("Picture 1");
  });

  it("should not generate files when no images", () => {
    const plugin = imagesPlugin();
    const files = new Map<string, string | Uint8Array>();
    plugin.afterGenerate?.(files);

    expect(files.size).toBe(0);
  });

  it("should handle offset values", () => {
    const plugin = imagesPlugin();
    const pngData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

    plugin.addImage({
      cell: "A1",
      image: pngData,
      width: 100,
      height: 100,
      offsetX: 10,
      offsetY: 20,
    });

    const images = plugin.getImages();
    expect(images[0].offsetX).toBe(10);
    expect(images[0].offsetY).toBe(20);
  });

  it("should default offset to 0", () => {
    const plugin = imagesPlugin();
    const pngData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

    plugin.addImage({
      cell: "A1",
      image: pngData,
      width: 100,
      height: 100,
    });

    const images = plugin.getImages();
    expect(images[0].offsetX).toBe(0);
    expect(images[0].offsetY).toBe(0);
  });
});

describe("addImage helper", () => {
  it("should add image via helper function", () => {
    const plugin = imagesPlugin();
    const pngData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

    addImage(plugin, { cell: "C3", image: pngData, width: 50, height: 50 });

    const images = plugin.getImages();
    expect(images).toHaveLength(1);
    expect(images[0].cell).toBe("C3");
  });
});
