export const VML_SHAPE_BASE_ID = 1025;
export const VML_SHAPE_WIDTH = 108;
export const VML_SHAPE_HEIGHT = 59.25;
export const CELL_WIDTH_PT = 64;
export const CELL_HEIGHT_PT = 15;

export const XML_DECLARATION =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

export const COMMENTS_NAMESPACE =
  "http://schemas.openxmlformats.org/spreadsheetml/2006/main";

export const VML_NAMESPACES = {
  v: "urn:schemas-microsoft-com:vml",
  o: "urn:schemas-microsoft-com:office:office",
  x: "urn:schemas-microsoft-com:office:excel",
} as const;

export const CONTENT_TYPE_COMMENTS =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml";
