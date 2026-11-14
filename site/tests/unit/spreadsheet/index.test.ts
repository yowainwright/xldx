import { describe, expect, test } from "bun:test";
import { Effect, Result } from "effect";
import {
  columnLabel,
  createGrid,
  createSpreadsheet,
  commitCell,
  readInput,
  readDisplay,
} from "../../../src/components/Spreadsheet/utils";

describe("spreadsheet edits", () => {
  test.each(["001", "TRUE", "=1+1", "=", "=   ", "'literal"])(
    "retains literal text %s when editing again",
    (literal) => {
      const first = Effect.runSync(commitCell(createSpreadsheet(), "A1", "'" + literal));
      const input = readInput(first.toJSON().sheets[0].data[0][0]);
      const second = Effect.runSync(commitCell(first, "A1", input));
      expect(second.toJSON().sheets[0].data[0][0]).toBe(literal);
      expect(readDisplay(second.calculate().workbook.sheets[0].data[0][0])).toBe(literal);
    },
  );
  test("updates dependent results and preserves raw input", () => {
    const first = Effect.runSync(commitCell(createSpreadsheet(), "A2", "2"));
    const second = Effect.runSync(commitCell(first, "B2", "=A2*2"));
    const third = Effect.runSync(commitCell(second, "A2", "3"));
    const raw = third.toJSON().sheets[0].data[1][1];
    expect(readInput(raw)).toBe("=A2*2");
    expect(readDisplay(third.calculate().workbook.sheets[0].data[1][1])).toBe("6");
    expect(first.toJSON().sheets[0].data[1][1]).toBeNull();
  });

  test.each([
    ["", null],
    [" ", " "],
    ["2.5", 2.5],
    ["TRUE", true],
    ["'001", "001"],
    ["'=1+1", "=1+1"],
    ["hello", "hello"],
  ])("stores editor input %s", (input, expected) => {
    const book = Effect.runSync(commitCell(createSpreadsheet(), "A1", String(input)));
    expect(book.toJSON().sheets[0].data[0][0]).toEqual(expected);
  });

  test("shows errors without discarding source and reports failed edits", () => {
    const book = Effect.runSync(commitCell(createSpreadsheet(), "A1", "=1/0"));
    expect(readDisplay(book.calculate().workbook.sheets[0].data[0][0])).toBe("#DIV/0!");
    expect(readInput(book.toJSON().sheets[0].data[0][0])).toBe("=1/0");
    const result = Effect.runSync(Effect.result(commitCell(book, "XFD100", "1")));
    expect(Result.isFailure(result)).toBe(true);
  });
});

describe("letter grid", () => {
  test("renders four distinct letters with padding and spacing", () => {
    const grid = createGrid("#10b981");
    expect(grid).toHaveLength(18);
    expect(grid.every((row) => row.length === 50)).toBe(true);
    const pattern = grid
      .filter((_, row) => row % 2 === 0)
      .map((row) =>
        row
          .filter((_, col) => col % 2 === 0)
          .map((cell) => (cell ? "#" : "."))
          .join(""),
      );
    expect(pattern).toEqual([
      ".........................",
      "........##.......#.......",
      ".........#.......#.......",
      ".#...#...#....##.#.#...#.",
      "..#.#....#...#..##..#.#..",
      "...#.....#...#...#...#...",
      "..#.#....#...#...#..#.#..",
      ".#...#..###...####.#...#.",
      ".........................",
    ]);
  });

  test("color changes preserve the letter pattern", () => {
    const green = createGrid("#10b981").flat();
    const purple = createGrid("#a855f7").flat();
    expect(purple.map(Boolean)).toEqual(green.map(Boolean));
    expect(purple.filter(Boolean).every((color) => color === "#a855f7")).toBe(true);
  });

  test("column names continue past Z", () => {
    expect([0, 25, 26, 49].map(columnLabel)).toEqual(["A", "Z", "AA", "AX"]);
  });
});
