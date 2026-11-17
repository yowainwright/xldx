export type BundleMeasurement = {
  consumer: string;
  target: "browser" | "node";
  rawBytes: number;
  gzipBytes: number;
  brotliBytes: number;
  retainedInputs: string[];
};
