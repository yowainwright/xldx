import { Xldx } from "../index";

declare module "../index" {
  interface Xldx {
    toBlob(): Promise<Blob>;
    download(filename?: string): Promise<void>;
  }
}

Xldx.prototype.toBlob = async function (): Promise<Blob> {
  const uint8Array = await this.toUint8Array();
  return new Blob([uint8Array], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

Xldx.prototype.download = async function (
  filename: string = "download.xlsx",
): Promise<void> {
  const blob = await this.toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export * from "../index";
