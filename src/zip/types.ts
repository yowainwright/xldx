export interface FileEntry {
  path: string;
  data: Uint8Array;
  lastModified?: Date;
}

export interface ZipRecord {
  fileName: Uint8Array;
  data: Uint8Array;
  date: number;
  time: number;
  crc: number;
  offset: number;
}

export interface ZipParts {
  header: Uint8Array;
  central: Uint8Array;
  data: Uint8Array;
}
