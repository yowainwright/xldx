export type Workload = {
  name: string;
  data: unknown[][];
  row: number;
  column: number;
  expected: number;
};
export type Measurement = { workload: string; operation: string; medianMs: number; p95Ms: number };
