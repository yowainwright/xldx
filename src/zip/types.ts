export interface FileEntry {
  readonly path: string;
  readonly data: Uint8Array;
}

export interface FileData {
  readonly fileName: Uint8Array;
  readonly crc: number;
  readonly data: Uint8Array;
  readonly compressedData?: Uint8Array;
  readonly offset: number;
  readonly compressionMethod: number;
}

export interface DosDateTime {
  readonly date: number;
  readonly time: number;
}

export interface ZipCalculation {
  readonly totalSize: number;
  readonly fileData: readonly FileData[];
}

export interface ZipOptions {
  readonly compress?: boolean;
}
