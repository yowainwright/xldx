import { expect, test } from "bun:test";
import { Formula, Xldx } from "../../../src/index";

function calculate(expression: string, values: unknown[][] = []) {
  const data = [...values, [{ formula: expression }]];
  const sheets = [{ name: "Data", data }];
  const book = Xldx.fromJSON({ sheets });
  const calculation = book.calculate();
  const cell = calculation.workbook.sheets[0].data[values.length][0];
  const { issues } = calculation;
  const actual = { cell, issues };
  return actual;
}

test.each([
  ["5+2*3", 11],
  ["(5+2)*3", 21],
  ["8/4/2", 1],
  ["-2*-3", 6],
  ["1E-3+.5", 0.501],
  ['"2"*3', 6],
  ["TRUE+FALSE", 1],
  ['SUM("5",15,TRUE)', 21],
  ['"a""b"', 'a"b'],
  ['"#REF!"', "#REF!"],
])("calculates %s", (expression, result) => {
  expect(calculate(String(expression)).cell).toEqual({ formula: expression, result });
});

test.each([
  ["1/0", "#DIV/0!"],
  ['""*1', "#VALUE!"],
  ["1E308*10", "#NUM!"],
  ["A0", "#REF!"],
  ["XFE1", "#REF!"],
  ["SUM(B2:A1)", "#REF!"],
])("reports spreadsheet errors for %s", (expression, error) => {
  const actual = calculate(expression);
  const result = { error };
  expect(actual.cell).toEqual({ formula: expression, result });
  expect(actual.issues).toHaveLength(1);
});

test("distinguishes SUM reference values from direct arguments", () => {
  const values = [[10], [15], [15], ["5"], [true]];
  expect(calculate("SUM(A1:A5)", values).cell).toEqual({ formula: "SUM(A1:A5)", result: 40 });
  expect(calculate("SUM(A4,A5,2)", values).cell).toEqual({ formula: "SUM(A4,A5,2)", result: 2 });
  expect(calculate("SUM(A4+0)", values).cell).toEqual({ formula: "SUM(A4+0)", result: 5 });
  expect(calculate("$A$1*2", values).cell).toEqual({ formula: "$A$1*2", result: 20 });
  expect(calculate("A50+1", values).cell).toEqual({ formula: "A50+1", result: 1 });
});

test("factory expressions and typed expressions calculate identically", () => {
  const { add: createAddition } = Formula;
  const first = createAddition(1, 2);
  const { formula } = Formula.multiply(first, 3);
  expect(calculate(formula).cell).toEqual({ formula, result: 9 });
  expect(calculate("(1+2)*3").cell).toEqual({ formula: "(1+2)*3", result: 9 });
});

test.each(["SUM(", "1+", "1 2", "SUM()", "1;globalThis.process.exit()", "AVERAGE(A1:A2)", "2^3"])(
  "retains unevaluated expression %s with diagnostics",
  (expression) => {
    const actual = calculate(expression);
    expect(actual.cell).toEqual({ formula: expression });
    expect(actual.issues).toHaveLength(1);
  },
);

test("terminates indirect cycles and still calculates unrelated cells", () => {
  const data = [[{ formula: "B1" }, { formula: "SUM(A1:A1)" }, { formula: "2+3" }]];
  const sheets = [{ name: "Data", data }];
  const actual = Xldx.fromJSON({ sheets }).calculate();
  const result = { error: "#REF!" };
  expect(actual.workbook.sheets[0].data[0]).toEqual([
    { formula: "B1", result },
    { formula: "SUM(A1:A1)", result },
    { formula: "2+3", result: 5 },
  ]);
  expect(actual.issues.map((issue) => issue.code)).toEqual(["cycle", "cycle"]);
});

test("does not use stale caches or treat unevaluated precedents as blank", () => {
  const data = [[{ formula: "AVERAGE(C1:C2)", result: 999 }, { formula: "A1+1" }]];
  const sheets = [{ name: "Data", data }];
  const book = Xldx.fromJSON({ sheets });
  const actual = book.calculate();
  expect(actual.workbook.sheets[0].data[0]).toEqual([
    { formula: "AVERAGE(C1:C2)" },
    { formula: "A1+1" },
  ]);
  expect(actual.issues.map((issue) => issue.code)).toEqual(["unsupported", "unsupported"]);
  expect(book.toJSON().sheets[0].data).toEqual(data);
});

test.each(["(".repeat(129) + "1" + ")".repeat(129), "1".repeat(8193), "SUM(A1:XFD1048576)"])(
  "bounds excessive expressions",
  (expression) => {
    const actual = calculate(expression);
    expect(actual.cell).toEqual({ formula: expression });
    expect(actual.issues[0].code).toBe("limit");
  },
);
