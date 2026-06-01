import type { DosDateTime, FileEntry, FileData, ZipCalculation } from "./types";
import {
  crc32,
  NO_COMPRESSION,
  DEFLATE_COMPRESSION,
  LOCAL_HEADER_SIZE,
  CENTRAL_HEADER_SIZE,
  END_OF_CENTRAL_DIR_SIZE,
} from "./constants";
import { deflate, supportsCompression } from "./compress";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function encodeString(str: string): Uint8Array {
  return textEncoder.encode(str);
}

export function decodeBytes(data: Uint8Array): string {
  return textDecoder.decode(data);
}

/**
 * Converts a JavaScript Date to MS-DOS date/time format.
 *
 * DOS date format (16 bits):
 *   - Bits 0-4: Day (1-31)
 *   - Bits 5-8: Month (1-12)
 *   - Bits 9-15: Year offset from 1980 (0-127)
 *
 * DOS time format (16 bits):
 *   - Bits 0-4: Seconds / 2 (0-29)
 *   - Bits 5-10: Minutes (0-59)
 *   - Bits 11-15: Hours (0-23)
 *
 * @see https://docs.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-dosdatetimetofiletime
 * @param date - The date to convert
 * @returns DOS date and time as separate 16-bit values
 */
export function dosDateTime(date: Date): DosDateTime {
  const year = date.getFullYear() - 1980;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  const dosDate = (year << 9) | (month << 5) | day;
  const dosTime = (hours << 11) | (minutes << 5) | seconds;

  return { date: dosDate, time: dosTime };
}

export function createFileData(
  file: FileEntry,
  offset: number,
  compress: boolean = false,
): FileData {
  const fileName = encodeString(file.path);
  const fileCrc = crc32(file.data);
  const compressionMethod = compress ? DEFLATE_COMPRESSION : NO_COMPRESSION;
  return { fileName, crc: fileCrc, data: file.data, offset, compressionMethod };
}

export async function createFileDataCompressed(
  file: FileEntry,
  offset: number,
): Promise<FileData> {
  const fileName = encodeString(file.path);
  const fileCrc = crc32(file.data);
  const compressedData = await deflate(file.data);
  return {
    fileName,
    crc: fileCrc,
    data: file.data,
    compressedData,
    offset,
    compressionMethod: DEFLATE_COMPRESSION,
  };
}

export function calculateZipSize(files: readonly FileEntry[]): ZipCalculation {
  const fileData: FileData[] = [];
  let offset = 0;
  let totalSize = END_OF_CENTRAL_DIR_SIZE;

  for (const file of files) {
    const fd = createFileData(file, offset);
    const dataSize = fd.compressedData?.length ?? fd.data.length;
    const localSize = LOCAL_HEADER_SIZE + fd.fileName.length + dataSize;
    const centralSize = CENTRAL_HEADER_SIZE + fd.fileName.length;

    fileData.push(fd);
    offset += localSize;
    totalSize += localSize + centralSize;
  }

  return { totalSize, fileData };
}

export async function calculateZipSizeCompressed(
  files: readonly FileEntry[],
): Promise<ZipCalculation> {
  const compressedFiles = await Promise.all(
    files.map((file) => createFileDataCompressed(file, 0)),
  );

  let offset = 0;
  const fileData = compressedFiles.map((fd) => {
    const dataSize = fd.compressedData?.length ?? fd.data.length;
    const localSize = LOCAL_HEADER_SIZE + fd.fileName.length + dataSize;
    const updated = { ...fd, offset };
    offset += localSize;
    return updated;
  });

  const totalSize = fileData.reduce((sum, fd) => {
    const dataSize = fd.compressedData?.length ?? fd.data.length;
    return (
      sum +
      LOCAL_HEADER_SIZE +
      fd.fileName.length +
      dataSize +
      CENTRAL_HEADER_SIZE +
      fd.fileName.length
    );
  }, END_OF_CENTRAL_DIR_SIZE);

  return { totalSize, fileData };
}

export { supportsCompression };

export function sliceBytes(
  data: Uint8Array,
  start: number,
  end: number,
): Uint8Array {
  return data.slice(start, end);
}

export function readUint16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

export function readUint32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

export function writeUint16(
  view: DataView,
  offset: number,
  value: number,
): void {
  view.setUint16(offset, value, true);
}

export function writeUint32(
  view: DataView,
  offset: number,
  value: number,
): void {
  view.setUint32(offset, value, true);
}
