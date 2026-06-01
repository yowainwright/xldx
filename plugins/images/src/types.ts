export type ImageType = "png" | "jpeg" | "gif";

export interface ImageOptions {
  readonly sheet?: string;
  readonly cell: string;
  readonly image: Uint8Array;
  readonly type?: ImageType;
  readonly width: number;
  readonly height: number;
  readonly offsetX?: number;
  readonly offsetY?: number;
}

export interface InternalImage {
  sheetIndex: number;
  cell: string;
  image: Uint8Array;
  type: ImageType;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  imageId: number;
}

export interface CellPosition {
  row: number;
  col: number;
}
