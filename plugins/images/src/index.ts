import type { XldxPlugin } from "xldx";
import pkg from "../package.json";
import type {
  ImageType,
  ImageOptions,
  InternalImage,
  CellPosition,
} from "./types";
import {
  EMU_PER_PIXEL,
  XML_DECLARATION,
  DRAWING_NAMESPACE,
  DRAWING_MAIN_NAMESPACE,
  RELATIONSHIPS_NAMESPACE,
  CONTENT_TYPE_DRAWING,
  CONTENT_TYPES,
  IMAGE_RELATIONSHIP_TYPE,
  DRAWING_RELATIONSHIP_TYPE,
  PNG_SIGNATURE,
  JPEG_SIGNATURE,
  GIF_SIGNATURE,
} from "./constants";

export type {
  ImageType,
  ImageOptions,
  InternalImage,
  CellPosition,
} from "./types";

function cellToRowCol(cell: string): CellPosition {
  const match = cell.match(/^([A-Z]+)(\d+)$/);
  if (!match) throw new Error(`Invalid cell reference: ${cell}`);
  const colStr = match[1];
  const row = parseInt(match[2], 10);
  const col = colStr
    .split("")
    .reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0);
  return { row, col };
}

function detectImageType(data: Uint8Array): ImageType {
  const matchesSignature = (sig: number[]) =>
    sig.every((byte, i) => data[i] === byte);

  if (matchesSignature(PNG_SIGNATURE)) return "png";
  if (matchesSignature(JPEG_SIGNATURE)) return "jpeg";
  if (matchesSignature(GIF_SIGNATURE)) return "gif";
  return "png";
}

function emuFromPixels(pixels: number): number {
  return Math.round(pixels * EMU_PER_PIXEL);
}

function groupBySheet<T extends { sheetIndex: number }>(
  items: T[],
): Map<number, T[]> {
  return items.reduce((acc, item) => {
    const existing = acc.get(item.sheetIndex) || [];
    acc.set(item.sheetIndex, [...existing, item]);
    return acc;
  }, new Map<number, T[]>());
}

function generateDrawingXml(images: InternalImage[]): string {
  const anchors = images
    .map((img, i) => {
      const { row, col } = cellToRowCol(img.cell);
      const colOff = emuFromPixels(img.offsetX);
      const rowOff = emuFromPixels(img.offsetY);
      const cx = emuFromPixels(img.width);
      const cy = emuFromPixels(img.height);

      return `<xdr:twoCellAnchor editAs="oneCell">
<xdr:from><xdr:col>${col - 1}</xdr:col><xdr:colOff>${colOff}</xdr:colOff><xdr:row>${row - 1}</xdr:row><xdr:rowOff>${rowOff}</xdr:rowOff></xdr:from>
<xdr:to><xdr:col>${col}</xdr:col><xdr:colOff>${cx}</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>${cy}</xdr:rowOff></xdr:to>
<xdr:pic>
<xdr:nvPicPr>
<xdr:cNvPr id="${i + 2}" name="Picture ${i + 1}"/>
<xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr>
</xdr:nvPicPr>
<xdr:blipFill>
<a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId${i + 1}"/>
<a:stretch><a:fillRect/></a:stretch>
</xdr:blipFill>
<xdr:spPr>
<a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
</xdr:spPr>
</xdr:pic>
<xdr:clientData/>
</xdr:twoCellAnchor>`;
    })
    .join("\n");

  return `${XML_DECLARATION}
<xdr:wsDr xmlns:xdr="${DRAWING_NAMESPACE}" xmlns:a="${DRAWING_MAIN_NAMESPACE}">
${anchors}
</xdr:wsDr>`;
}

function generateDrawingRelsXml(images: InternalImage[]): string {
  const rels = images
    .map((img, i) => {
      const ext = img.type === "jpeg" ? "jpeg" : img.type;
      return `<Relationship Id="rId${i + 1}" Type="${IMAGE_RELATIONSHIP_TYPE}" Target="../media/image${img.imageId}.${ext}"/>`;
    })
    .join("\n");

  return `${XML_DECLARATION}
<Relationships xmlns="${RELATIONSHIPS_NAMESPACE}">
${rels}
</Relationships>`;
}

export function imagesPlugin(): XldxPlugin & {
  addImage(options: ImageOptions): void;
  getImages(): readonly ImageOptions[];
} {
  const images: InternalImage[] = [];
  let imageCounter = 1;

  return {
    name: pkg.name,
    version: pkg.version,

    addImage(options: ImageOptions): void {
      const type = options.type || detectImageType(options.image);
      images.push({
        sheetIndex: 0,
        cell: options.cell,
        image: options.image,
        type,
        width: options.width,
        height: options.height,
        offsetX: options.offsetX || 0,
        offsetY: options.offsetY || 0,
        imageId: imageCounter++,
      });
    },

    getImages(): readonly ImageOptions[] {
      return images.map((img) => ({
        cell: img.cell,
        image: img.image,
        type: img.type,
        width: img.width,
        height: img.height,
        offsetX: img.offsetX,
        offsetY: img.offsetY,
      }));
    },

    afterGenerate(files: Map<string, string | Uint8Array>): void {
      if (images.length === 0) return;

      const imagesBySheet = groupBySheet(images);

      Array.from(imagesBySheet.entries()).forEach(
        ([sheetIndex, sheetImages]) => {
          const drawingXml = generateDrawingXml(sheetImages);
          const drawingRelsXml = generateDrawingRelsXml(sheetImages);

          files.set(`xl/drawings/drawing${sheetIndex + 1}.xml`, drawingXml);
          files.set(
            `xl/drawings/_rels/drawing${sheetIndex + 1}.xml.rels`,
            drawingRelsXml,
          );

          sheetImages.forEach((img) => {
            const ext = img.type === "jpeg" ? "jpeg" : img.type;
            files.set(`xl/media/image${img.imageId}.${ext}`, img.image);
          });

          const worksheetPath = `xl/worksheets/sheet${sheetIndex + 1}.xml`;
          const worksheet = files.get(worksheetPath);
          if (typeof worksheet === "string") {
            const insertPoint = worksheet.indexOf("</worksheet>");
            if (insertPoint !== -1) {
              const drawingRef = `<drawing r:id="rId${sheetIndex + 2}"/>`;
              files.set(
                worksheetPath,
                worksheet.slice(0, insertPoint) +
                  drawingRef +
                  worksheet.slice(insertPoint),
              );
            }
          }

          const sheetRelsPath = `xl/worksheets/_rels/sheet${sheetIndex + 1}.xml.rels`;
          const existingRels = files.get(sheetRelsPath);
          const drawingRel = `<Relationship Id="rId${sheetIndex + 2}" Type="${DRAWING_RELATIONSHIP_TYPE}" Target="../drawings/drawing${sheetIndex + 1}.xml"/>`;

          if (typeof existingRels === "string") {
            const insertPoint = existingRels.indexOf("</Relationships>");
            if (insertPoint !== -1) {
              files.set(
                sheetRelsPath,
                existingRels.slice(0, insertPoint) +
                  drawingRel +
                  existingRels.slice(insertPoint),
              );
            }
          } else {
            files.set(
              sheetRelsPath,
              `${XML_DECLARATION}
<Relationships xmlns="${RELATIONSHIPS_NAMESPACE}">
${drawingRel}
</Relationships>`,
            );
          }
        },
      );
    },

    getContentTypes(): readonly string[] {
      if (images.length === 0) return [];

      const usedTypes = [...new Set(images.map((img) => img.type))];
      const sheets = [...new Set(images.map((img) => img.sheetIndex))];

      const typeOverrides = usedTypes.map((type) => {
        const ext = type === "jpeg" ? "jpeg" : type;
        return `<Default Extension="${ext}" ContentType="${CONTENT_TYPES[type]}"/>`;
      });

      const drawingOverrides = sheets.map(
        (sheetIndex) =>
          `<Override PartName="/xl/drawings/drawing${sheetIndex + 1}.xml" ContentType="${CONTENT_TYPE_DRAWING}"/>`,
      );

      return [...typeOverrides, ...drawingOverrides];
    },

    getRelationships(): readonly {
      id: string;
      type: string;
      target: string;
    }[] {
      return [];
    },
  };
}

export function addImage(
  plugin: ReturnType<typeof imagesPlugin>,
  options: ImageOptions,
): void {
  plugin.addImage(options);
}
