import { expect, test } from "bun:test";
import { Formula, Xldx } from "../../../src/index";

test("serializes explicit ranges and quotes literal strings", () => {
  expect(Formula.sum(Formula.range("A1", "A5")).toJSON()).toEqual({ formula: "SUM(A1:A5)" });
  expect(Formula.sum("A1:A5").toJSON()).toEqual({ formula: 'SUM("A1:A5")' });
  expect(Formula.sum('a"b').toJSON()).toEqual({ formula: 'SUM("a""b")' });
});

test("composes immutable formulas without losing precedence", () => {
  const first = Formula.parse("(1)+(2)");
  const next = Formula.multiply(first, 3);
  expect(next.formula).toBe("((1)+(2))*(3)");
  expect(first.formula).toBe("(1)+(2)");
  expect(Object.isFrozen(first)).toBe(true);
  expect(JSON.parse(JSON.stringify(first))).toEqual({ formula: "(1)+(2)" });
});

test("normalizes editor input and validates factory arguments", () => {
  expect(Formula.parse(" =SUM(A1:A5) ").formula).toBe("SUM(A1:A5)");
  expect(Formula.ref("$a$1").formula).toBe("$A$1");
  expect(() => Formula.parse("= ")).toThrow(TypeError);
  expect(() => Formula.ref("A0")).toThrow(RangeError);
  expect(() => Formula.range("B2", "A1")).toThrow(RangeError);
  const nonfinite = () => {
    Formula.add(Infinity, 1);
  };
  expect(nonfinite).toThrow(TypeError);
  expect(() => Formula.sum()).toThrow(TypeError);
});

test("validates reserved formula objects while keeping strings literal", () => {
  const data = [["=1+1", { formula: "1+1", result: 0 }]];
  const sheets = [{ name: "Data", data }];
  expect(Xldx.fromJSON({ sheets }).toJSON().sheets[0].data).toEqual(data);
  const invalid = [{ formula: "1", result: null }, { formula: "=1" }, { formula: "1", extra: 2 }];
  invalid.forEach((value) => {
    const data = [[value]];
    const sheets = [{ name: "Data", data }];
    const restore = () => Xldx.fromJSON({ sheets });
    expect(restore).toThrow(TypeError);
  });
});
