import type { Address, SpillRange } from "../types.js";
import type { Scalar } from "../parser/types.js";
import { FormulaFault } from "../parser/utils.js";

export class SpillGrid {
  ranges: SpillRange[] = [];
  private readonly values = new Map<number, Scalar>();
  private readonly anchors = new Set<number>();

  constructor(private readonly source: unknown[][]) {}

  read({ row, column }: Address): Scalar | undefined {
    const value = this.values.get(row * 16384 + column);
    return value;
  }

  remove({ row, column }: Address): void {
    const range = this.ranges.find((range) => range.row === row && range.column === column);
    if (!range) return;
    this.ranges = this.ranges.filter((candidate) => candidate !== range);
    const size = range.rows * range.columns;
    for (let offset = 0; offset < size; offset++) {
      const y = row + Math.floor(offset / range.columns);
      const x = column + (offset % range.columns);
      this.values.delete(y * 16384 + x);
    }
    this.anchors.delete(row * 16384 + column);
  }

  add(address: Address, values: Scalar[][], reads: Iterable<number> = []): void {
    const { row, column } = address;
    const { length: rows } = values;
    const { length: columns } = values[0];
    const range = { row, column, rows, columns };
    this.check(range);
    this.checkCycle(range, reads);
    const flattened = values.flat();
    this.write(range, flattened);
    this.anchors.add(row * 16384 + column);
    this.ranges[this.ranges.length] = range;
  }

  private checkCycle(range: SpillRange, reads: Iterable<number>): void {
    const cyclic = Array.from(reads).some((key) => {
      const row = Math.floor(key / 16384);
      const column = key % 16384;
      const withinRows = row >= range.row && row < range.row + range.rows;
      const withinColumns = column >= range.column && column < range.column + range.columns;
      const inside = withinRows && withinColumns;
      return inside;
    });
    if (cyclic) throw new FormulaFault("cycle", "Circular spill reference", "#REF!");
  }

  private write(range: SpillRange, values: Scalar[]): void {
    const { row, column, columns } = range;
    values.forEach((value, index) => {
      const y = Math.floor(index / columns);
      const x = index % columns;
      const key = (row + y) * 16384 + column + x;
      this.values.set(key, value);
    });
  }

  apply(data: unknown[][]): void {
    this.values.forEach((value, key) => {
      const row = Math.floor(key / 16384);
      const column = key % 16384;
      const anchor = this.anchors.has(key);
      if (anchor) return;
      const cells = data[row] ?? [];
      cells[column] = value;
      data[row] = cells;
    });
  }

  private check(range: SpillRange): void {
    const outside = range.row + range.rows > 1048576 || range.column + range.columns > 16384;
    if (outside) throw new FormulaFault("spill", "Spill extends beyond worksheet", "#SPILL!");
    const size = range.rows * range.columns;
    const blocked = Array.from({ length: size }, (_, index) => this.blocked(range, index)).some(
      Boolean,
    );
    if (blocked) throw new FormulaFault("spill", "Spill range contains data", "#SPILL!");
  }

  private blocked(range: SpillRange, index: number): boolean {
    const row = range.row + Math.floor(index / range.columns);
    const column = range.column + (index % range.columns);
    if (index === 0) return false;
    const value = this.source[row]?.[column];
    const occupied = value !== null && value !== undefined;
    const claimed = this.values.has(row * 16384 + column);
    const blocked = occupied || claimed;
    return blocked;
  }
}
