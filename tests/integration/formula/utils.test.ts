import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";

test.each(["xldx/browser", "xldx/server"])(
  "calculates and roundtrips formulas through native Node using %s",
  (entry) => {
    const script = `
    import { Formula, Xldx } from "${entry}";
    delete globalThis.Buffer;
    const value = Formula.multiply(Formula.ref("A1"), 2);
    const book = Xldx.fromJSON({ sheets: [{name:"Data", data:[[2,value]]}] });
    book.getSheetData(0).updateCellData("A1",3);
    const bytes = await book.toUint8Array();
    process.stdout.write(JSON.stringify(await Xldx.read(bytes)));
  `;
    const args = ["--input-type=module", "--eval", script];
    const result = spawnSync("node", args, { encoding: "utf8" });
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).sheets[0].data[0]).toEqual([
      3,
      { formula: "(A1)*(2)", result: 6 },
    ]);
  },
);
