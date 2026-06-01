import { Xldx } from "../src/server/index";

const ROWS = 10000;
const COLS = 20;
const RUNS = 3;

function generateData(rows: number, cols: number) {
  return Array.from({ length: rows }, (_, i) =>
    Object.fromEntries(
      Array.from({ length: cols }, (_, j) => [`col${j}`, `Value ${i}-${j}`]),
    ),
  );
}

function generateColumns(cols: number) {
  return Array.from({ length: cols }, (_, i) => ({
    key: `col${i}`,
    header: `Column ${i}`,
  }));
}

async function runUncompressed(
  data: Record<string, unknown>[],
  columns: { key: string; header: string }[],
) {
  const start = performance.now();
  const xldx = new Xldx(data);
  xldx.createSheet({ name: "Benchmark" }, ...columns);
  const bytes = await xldx.toUint8Array();
  return { time: performance.now() - start, size: bytes.length };
}

async function runCompressed(
  data: Record<string, unknown>[],
  columns: { key: string; header: string }[],
) {
  const start = performance.now();
  const xldx = new Xldx(data);
  xldx.createSheet({ name: "Benchmark" }, ...columns);
  const bytes = await xldx.toUint8ArrayCompressed();
  return { time: performance.now() - start, size: bytes.length };
}

function printResults(label: string, times: number[], size: number) {
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);

  console.log(`\n${label}:`);
  console.log(`  Average: ${avg.toFixed(2)}ms`);
  console.log(`  Best:    ${min.toFixed(2)}ms`);
  console.log(`  Size:    ${(size / 1024).toFixed(2)} KB`);
  console.log(`  Rows/s:  ${Math.round(ROWS / (min / 1000)).toLocaleString()}`);
  console.log(
    `  Cells/s: ${Math.round((ROWS * COLS) / (min / 1000)).toLocaleString()}`,
  );
}

async function benchmark() {
  console.log(
    `\nxldx Benchmark: ${ROWS.toLocaleString()} rows x ${COLS} columns (${RUNS} runs)`,
  );
  console.log("=".repeat(60));

  const data = generateData(ROWS, COLS);
  const columns = generateColumns(COLS);

  // Warmup
  await runUncompressed(data, columns);
  await runCompressed(data, columns);

  // Uncompressed
  const uncompressedTimes: number[] = [];
  let uncompressedSize = 0;
  for (let i = 0; i < RUNS; i++) {
    const result = await runUncompressed(data, columns);
    uncompressedTimes.push(result.time);
    uncompressedSize = result.size;
  }

  // Compressed
  const compressedTimes: number[] = [];
  let compressedSize = 0;
  for (let i = 0; i < RUNS; i++) {
    const result = await runCompressed(data, columns);
    compressedTimes.push(result.time);
    compressedSize = result.size;
  }

  printResults("Uncompressed", uncompressedTimes, uncompressedSize);
  printResults("Compressed (deflate)", compressedTimes, compressedSize);

  const ratio = ((1 - compressedSize / uncompressedSize) * 100).toFixed(1);
  console.log(`\nCompression ratio: ${ratio}% smaller`);
  console.log("=".repeat(60));
}

benchmark().catch(console.error);
