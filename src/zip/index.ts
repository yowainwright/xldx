import type { FileEntry, ZipRecord, ZipParts } from "./types.js";

export class MiniZip {
  private static crcTable: Uint32Array | undefined;
  private files: FileEntry[] = [];

  addFile(path: string, content: string | Uint8Array): void {
    const data = typeof content === "string" ? new TextEncoder().encode(content) : content;

    const lastModified = new Date();
    this.files[this.files.length] = { path, data, lastModified };
  }

  private crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    const table = MiniZip.getCRC32Table();

    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
    }

    const checksum = (crc ^ 0xffffffff) >>> 0;
    return checksum;
  }

  private static getCRC32Table(): Uint32Array {
    const { crcTable } = MiniZip;
    if (crcTable) return crcTable;
    const table = Uint32Array.from({ length: 256 }, (_, index) => MiniZip.crcTableEntry(index));
    MiniZip.crcTable = table;
    return table;
  }

  private static crcTableEntry(index: number): number {
    let value = index;
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    const entry = value >>> 0;
    return entry;
  }

  private dosDateTime(date: Date): { date: number; time: number } {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = Math.floor(date.getSeconds() / 2);

    const dosDate = ((year - 1980) << 9) | (month << 5) | day;
    const dosTime = (hours << 11) | (minutes << 5) | seconds;

    const encoded = { date: dosDate, time: dosTime };
    return encoded;
  }

  generate(): Uint8Array<ArrayBuffer> {
    const records = Array.from(this.buildRecords());
    const localFiles = records.flatMap(({ header, data }) => [header, data]);
    const centralDirectory = records.map(({ central }) => central);
    const localSize = localFiles.reduce((sum, part) => sum + part.length, 0);
    const centralSize = centralDirectory.reduce((sum, part) => sum + part.length, 0);
    const end = this.createEndRecord(localSize, centralSize);
    const parts = localFiles.concat(centralDirectory, [end]);
    const archive = this.combineParts(parts);
    return archive;
  }

  private *buildRecords(): Generator<ZipParts> {
    let offset = 0;
    for (const file of this.files) {
      const record = this.buildRecord(file, offset);
      yield record;
      offset += record.header.length + record.data.length;
    }
  }

  private buildRecord(file: FileEntry, offset: number): ZipParts {
    const fileName = new TextEncoder().encode(file.path);
    const { data } = file;
    const { date, time } = this.dosDateTime(file.lastModified || new Date());
    const crc = this.crc32(data);
    const record = { fileName, data, date, time, crc, offset };
    const header = this.createLocalHeader(record);
    const central = this.createCentralHeader(record);
    const parts = { header, central, data };
    return parts;
  }

  private createLocalHeader(record: ZipRecord): Uint8Array {
    const { fileName, data, date, time, crc } = record;
    const header = new Uint8Array(30 + fileName.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(10, time, true);
    view.setUint16(12, date, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, fileName.length, true);
    header.set(fileName, 30);
    return header;
  }

  private createCentralHeader(record: ZipRecord): Uint8Array {
    const { fileName, data, date, time, crc, offset } = record;
    const header = new Uint8Array(46 + fileName.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(12, time, true);
    view.setUint16(14, date, true);
    view.setUint32(16, crc, true);
    view.setUint32(20, data.length, true);
    view.setUint32(24, data.length, true);
    view.setUint16(28, fileName.length, true);
    view.setUint32(42, offset, true);
    header.set(fileName, 46);
    return header;
  }

  private createEndRecord(localSize: number, centralSize: number): Uint8Array {
    const record = new Uint8Array(22);
    const view = new DataView(record.buffer);
    view.setUint32(0, 0x06054b50, true);
    view.setUint16(8, this.files.length, true);
    view.setUint16(10, this.files.length, true);
    view.setUint32(12, centralSize, true);
    view.setUint32(16, localSize, true);
    return record;
  }

  private combineParts(parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
    const size = parts.reduce((sum, part) => sum + part.length, 0);
    const archive = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) {
      archive.set(part, offset);
      offset += part.length;
    }
    return archive;
  }
}

export class MiniUnzip {
  private data: Uint8Array;
  private view: DataView;

  constructor(data: Uint8Array) {
    this.data = data;
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  }

  getFile(path: string): string | null {
    for (const entry of this.entries()) {
      if (entry.name !== path) continue;
      const bytes = this.data.slice(entry.start, entry.end);
      const content = new TextDecoder().decode(bytes);
      return content;
    }

    return null;
  }

  listFiles(): string[] {
    const files = Array.from(this.entries(), (entry) => entry.name);
    return files;
  }

  private *entries() {
    let offset = 0;

    while (offset < this.data.length - 4) {
      const signature = this.view.getUint32(offset, true);

      if (signature === 0x04034b50) {
        const entry = this.readEntry(offset);
        yield entry;
        offset = entry.end;
        continue;
      }
      const isDirectory = signature === 0x02014b50 || signature === 0x06054b50;
      if (isDirectory) break;
      offset++;
    }
  }

  private readEntry(offset: number) {
    const method = this.view.getUint16(offset + 8, true);
    if (method !== 0) throw new Error(`Unsupported ZIP compression: ${method}`);
    const length = this.view.getUint16(offset + 26, true);
    const extraLength = this.view.getUint16(offset + 28, true);
    const size = this.view.getUint32(offset + 18, true);
    const nameStart = offset + 30;
    const nameEnd = nameStart + length;
    const bytes = this.data.slice(nameStart, nameEnd);
    const name = new TextDecoder().decode(bytes);
    const start = nameEnd + extraLength;
    const end = start + size;
    const entry = { name, start, end };
    return entry;
  }
}
