import { Xldx } from "../index";

declare module "../index" {
  interface Xldx {
    toBuffer(): Promise<Buffer>;
    write(filePath: string): Promise<void>;
    download(filename?: string): Promise<void>;
  }
}

Xldx.prototype.toBuffer = async function (): Promise<Buffer> {
  const uint8Array = await this.toUint8Array();
  return Buffer.from(uint8Array);
};

Xldx.prototype.write = async function (filePath: string): Promise<void> {
  const buffer = await this.toBuffer();
  const fs = await import("fs/promises");
  await fs.writeFile(filePath, buffer);
};

Xldx.prototype.download = async function (
  filename: string = "download.xlsx",
): Promise<void> {
  await this.write(filename);
};

export * from "../index";
