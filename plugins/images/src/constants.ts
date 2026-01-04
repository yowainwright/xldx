export const PLUGIN_NAME = "@xldx/images";
export const PLUGIN_VERSION = "0.0.1";

export const EMU_PER_PIXEL = 9525;

export const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

export const DRAWING_NAMESPACE = "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing";
export const DRAWING_MAIN_NAMESPACE = "http://schemas.openxmlformats.org/drawingml/2006/main";
export const RELATIONSHIPS_NAMESPACE = "http://schemas.openxmlformats.org/package/2006/relationships";

export const CONTENT_TYPE_DRAWING = "application/vnd.openxmlformats-officedocument.drawing+xml";

export const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
};

export const IMAGE_RELATIONSHIP_TYPE =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image";
export const DRAWING_RELATIONSHIP_TYPE =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing";

export const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
export const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
export const GIF_SIGNATURE = [0x47, 0x49, 0x46, 0x38];
