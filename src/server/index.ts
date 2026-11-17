import { Xldx } from "../index.js";

declare module "../index.js" {
  interface Xldx {
    toBuffer(): Promise<Buffer>;
    write(filePath: string): Promise<void>;
    download(filename?: string): Promise<void>;
  }
}

Xldx.prototype.toBuffer = async function (): Promise<Buffer> {
  const uint8Array = await this.toUint8Array();
  const buffer = Buffer.from(uint8Array);
  return buffer;
};

Xldx.prototype.write = async function (filePath: string): Promise<void> {
  const data = await this.toUint8Array();
  const fs = await import("fs/promises");
  await fs.writeFile(filePath, data);
};

Xldx.prototype.download = async function (filename: string = "download.xlsx"): Promise<void> {
  await this.write(filename);
};

export * from "../index.js";
