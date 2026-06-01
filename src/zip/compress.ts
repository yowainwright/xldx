/**
 * Compression utilities using native CompressionStream API.
 * Available in modern browsers and Node.js 18+.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream
 */

export function supportsCompression(): boolean {
  return typeof CompressionStream !== "undefined";
}

export async function deflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream();
  const compressed = stream.pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(compressed).arrayBuffer());
}

export async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream();
  const decompressed = stream.pipeThrough(
    new DecompressionStream("deflate-raw"),
  );
  return new Uint8Array(await new Response(decompressed).arrayBuffer());
}

interface BunCompression {
  inflateSync?: (data: Uint8Array) => Uint8Array | ArrayBuffer;
}

export function inflateSync(data: Uint8Array): Uint8Array | null {
  const bun = (globalThis as { Bun?: BunCompression }).Bun;
  const result = bun?.inflateSync?.(data);
  if (!result) return null;

  return result instanceof Uint8Array ? result : new Uint8Array(result);
}
