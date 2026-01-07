import type { FileEntry, FileData, DosDateTime } from "./types";
import {
  LOCAL_FILE_HEADER_SIGNATURE,
  CENTRAL_DIR_HEADER_SIGNATURE,
  END_OF_CENTRAL_DIR_SIGNATURE,
  ZIP_VERSION,
  LOCAL_HEADER_SIZE,
  CENTRAL_HEADER_SIZE,
} from "./constants";
import {
  encodeString,
  decodeBytes,
  dosDateTime,
  calculateZipSize,
  calculateZipSizeCompressed,
  sliceBytes,
  readUint16,
  readUint32,
  writeUint16,
  writeUint32,
} from "./utils";
import { inflate } from "./compress";

export type {
  FileEntry,
  FileData,
  DosDateTime,
  ZipCalculation,
  ZipOptions,
} from "./types";
export * from "./constants";
export * from "./utils";
export { buildCrc32Table } from "./crc32";
export { deflate, inflate, supportsCompression } from "./compress";

export function writeLocalHeader(
  view: DataView,
  pos: number,
  result: Uint8Array,
  fileData: FileData,
  dateTime: DosDateTime,
): number {
  const { fileName, crc, data, compressedData, compressionMethod } = fileData;
  const { date, time } = dateTime;
  const writeData = compressedData ?? data;
  const compressedSize = writeData.length;
  const uncompressedSize = data.length;

  writeUint32(view, pos, LOCAL_FILE_HEADER_SIGNATURE);
  writeUint16(view, pos + 4, ZIP_VERSION);
  writeUint16(view, pos + 6, 0);
  writeUint16(view, pos + 8, compressionMethod);
  writeUint16(view, pos + 10, time);
  writeUint16(view, pos + 12, date);
  writeUint32(view, pos + 14, crc);
  writeUint32(view, pos + 18, compressedSize);
  writeUint32(view, pos + 22, uncompressedSize);
  writeUint16(view, pos + 26, fileName.length);
  writeUint16(view, pos + 28, 0);

  const fileNameStart = pos + LOCAL_HEADER_SIZE;
  result.set(fileName, fileNameStart);

  const dataStart = fileNameStart + fileName.length;
  result.set(writeData, dataStart);

  return dataStart + writeData.length;
}

export function writeCentralHeader(
  view: DataView,
  pos: number,
  result: Uint8Array,
  fileData: FileData,
  dateTime: DosDateTime,
): number {
  const { fileName, crc, data, compressedData, offset, compressionMethod } =
    fileData;
  const { date, time } = dateTime;
  const compressedSize = (compressedData ?? data).length;
  const uncompressedSize = data.length;

  writeUint32(view, pos, CENTRAL_DIR_HEADER_SIGNATURE);
  writeUint16(view, pos + 4, ZIP_VERSION);
  writeUint16(view, pos + 6, ZIP_VERSION);
  writeUint16(view, pos + 8, 0);
  writeUint16(view, pos + 10, compressionMethod);
  writeUint16(view, pos + 12, time);
  writeUint16(view, pos + 14, date);
  writeUint32(view, pos + 16, crc);
  writeUint32(view, pos + 20, compressedSize);
  writeUint32(view, pos + 24, uncompressedSize);
  writeUint16(view, pos + 28, fileName.length);
  writeUint16(view, pos + 30, 0);
  writeUint16(view, pos + 32, 0);
  writeUint16(view, pos + 34, 0);
  writeUint16(view, pos + 36, 0);
  writeUint32(view, pos + 38, 0);
  writeUint32(view, pos + 42, offset);

  const fileNameStart = pos + CENTRAL_HEADER_SIZE;
  result.set(fileName, fileNameStart);

  return fileNameStart + fileName.length;
}

export function writeEndOfCentralDir(
  view: DataView,
  pos: number,
  fileCount: number,
  cdSize: number,
  cdStart: number,
): void {
  writeUint32(view, pos, END_OF_CENTRAL_DIR_SIGNATURE);
  writeUint16(view, pos + 4, 0);
  writeUint16(view, pos + 6, 0);
  writeUint16(view, pos + 8, fileCount);
  writeUint16(view, pos + 10, fileCount);
  writeUint32(view, pos + 12, cdSize);
  writeUint32(view, pos + 16, cdStart);
  writeUint16(view, pos + 20, 0);
}

export function writeEmptyZip(): Uint8Array {
  const result = new Uint8Array(22);
  const view = new DataView(result.buffer);
  writeEndOfCentralDir(view, 0, 0, 0, 0);
  return result;
}

function assembleZip(
  fileData: readonly FileData[],
  fileCount: number,
  totalSize: number,
): Uint8Array {
  const dateTime = dosDateTime(new Date());
  const result = new Uint8Array(totalSize);
  const view = new DataView(result.buffer);

  let pos = 0;
  for (const fd of fileData) {
    pos = writeLocalHeader(view, pos, result, fd, dateTime);
  }

  const cdStart = pos;
  for (const fd of fileData) {
    pos = writeCentralHeader(view, pos, result, fd, dateTime);
  }

  const cdSize = pos - cdStart;
  writeEndOfCentralDir(view, pos, fileCount, cdSize, cdStart);

  return result;
}

export function generateZip(files: readonly FileEntry[]): Uint8Array {
  const isEmpty = files.length === 0;
  if (isEmpty) return writeEmptyZip();

  const { totalSize, fileData } = calculateZipSize(files);
  return assembleZip(fileData, files.length, totalSize);
}

export async function generateZipCompressed(
  files: readonly FileEntry[],
): Promise<Uint8Array> {
  const isEmpty = files.length === 0;
  if (isEmpty) return writeEmptyZip();

  const { totalSize, fileData } = await calculateZipSizeCompressed(files);
  return assembleZip(fileData, files.length, totalSize);
}

export class MiniZip {
  private readonly files: FileEntry[] = [];

  addFile(path: string, content: string | Uint8Array): void {
    const data = typeof content === "string" ? encodeString(content) : content;
    this.files.push({ path, data });
  }

  generate(): Uint8Array {
    return generateZip(this.files);
  }

  async generateCompressed(): Promise<Uint8Array> {
    return generateZipCompressed(this.files);
  }
}

export function isLocalHeader(signature: number): boolean {
  return signature === LOCAL_FILE_HEADER_SIGNATURE;
}

export function isCentralOrEndHeader(signature: number): boolean {
  return (
    signature === CENTRAL_DIR_HEADER_SIGNATURE ||
    signature === END_OF_CENTRAL_DIR_SIGNATURE
  );
}

export interface LocalFileEntry {
  fileName: string;
  content: Uint8Array;
  compressionMethod: number;
  nextOffset: number;
}

export function parseLocalFileEntry(
  data: Uint8Array,
  view: DataView,
  offset: number,
): LocalFileEntry {
  const compressionMethod = readUint16(view, offset + 8);
  const compressedSize = readUint32(view, offset + 18);
  const fileNameLength = readUint16(view, offset + 26);
  const extraFieldLength = readUint16(view, offset + 28);

  const fileNameStart = offset + LOCAL_HEADER_SIZE;
  const fileNameEnd = fileNameStart + fileNameLength;
  const fileName = decodeBytes(sliceBytes(data, fileNameStart, fileNameEnd));

  const contentStart = fileNameEnd + extraFieldLength;
  const contentEnd = contentStart + compressedSize;
  const content = sliceBytes(data, contentStart, contentEnd);

  return { fileName, content, compressionMethod, nextOffset: contentEnd };
}

function iterateEntries<T>(
  data: Uint8Array,
  view: DataView,
  onEntry: (entry: LocalFileEntry) => T | null,
): T | null {
  let offset = 0;
  const maxOffset = data.length - 4;

  while (offset < maxOffset) {
    const signature = readUint32(view, offset);

    if (isCentralOrEndHeader(signature)) return null;
    if (!isLocalHeader(signature)) {
      offset++;
      continue;
    }

    const entry = parseLocalFileEntry(data, view, offset);
    const result = onEntry(entry);
    if (result !== null) return result;

    offset = entry.nextOffset;
  }

  return null;
}

export function findFile(
  data: Uint8Array,
  view: DataView,
  targetPath: string,
): string | null {
  return iterateEntries(data, view, (entry) => {
    const isMatch = entry.fileName === targetPath;
    return isMatch ? decodeBytes(entry.content) : null;
  });
}

export async function findFileAsync(
  data: Uint8Array,
  view: DataView,
  targetPath: string,
): Promise<string | null> {
  const result = iterateEntries(data, view, (entry) => {
    const isMatch = entry.fileName === targetPath;
    return isMatch ? entry : null;
  });

  if (!result) return null;

  const isCompressed = result.compressionMethod !== 0;
  const content = isCompressed ? await inflate(result.content) : result.content;
  return decodeBytes(content);
}

export function collectFiles(data: Uint8Array, view: DataView): string[] {
  const files: string[] = [];

  iterateEntries(data, view, (entry) => {
    files.push(entry.fileName);
    return null;
  });

  return files;
}

export class MiniUnzip {
  private readonly data: Uint8Array;
  private readonly view: DataView;

  constructor(data: Uint8Array) {
    this.data = data;
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  }

  getFile(path: string): string | null {
    return findFile(this.data, this.view, path);
  }

  getFileAsync(path: string): Promise<string | null> {
    return findFileAsync(this.data, this.view, path);
  }

  listFiles(): string[] {
    return collectFiles(this.data, this.view);
  }
}
