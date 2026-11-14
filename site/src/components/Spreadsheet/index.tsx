"use client";

import { useMemo, useState } from "react";
import { Effect, Result } from "effect";
import { FormulaBar } from "./FormulaBar";
import { Grid } from "./Grid";
import { columnLabel, commitCell, createSpreadsheet, readInput } from "./utils";

function useSpreadsheet() {
  const [book, setBook] = useState(createSpreadsheet);
  const [selected, setSelected] = useState({ row: 0, column: 0 });
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  const calculation = useMemo(() => book.calculate(), [book]);
  const address = `${columnLabel(selected.column)}${selected.row + 1}`;
  const issue = calculation.issues.find((item) => item.cell === address);
  const commit = () => {
    const result = Effect.runSync(Effect.result(commitCell(book, address, draft)));
    if (Result.isFailure(result)) {
      setError(result.failure.message);
      return;
    }
    setBook(result.success);
    setEditing(false);
    setError(undefined);
  };
  const select = (row: number, column: number) => {
    setSelected({ row, column });
    setDraft(readInput(book.toJSON().sheets[0].data[row][column]));
    setEditing(false);
    setError(undefined);
  };
  const edit = (row: number, column: number) => {
    select(row, column);
    setEditing(true);
  };
  const cancel = () => select(selected.row, selected.column);
  return {
    data: calculation.workbook.sheets[0].data,
    selected,
    address,
    draft,
    editing,
    error: error ?? issue?.message,
    commit,
    select,
    edit,
    cancel,
    setDraft,
  };
}

export function Spreadsheet() {
  const state = useSpreadsheet();
  return (
    <section
      aria-label="Spreadsheet"
      className="overflow-hidden rounded-lg border bg-card shadow-sm"
    >
      <FormulaBar
        selected={state.address}
        formula={state.draft}
        error={state.error}
        onFormulaChange={state.setDraft}
        onRun={state.commit}
      />
      <Grid
        data={state.data}
        selected={state.selected}
        editing={state.editing}
        draft={state.draft}
        onSelect={state.select}
        onEdit={state.edit}
        onDraftChange={state.setDraft}
        onCommit={state.commit}
        onCancel={state.cancel}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Sheet 1</span>
        <p id="formula-help">
          Select a cell. Edit above, or double-click a cell. Enter saves; Escape cancels.
        </p>
      </div>
      <p id="formula-error" role="alert" className="px-4 text-sm text-destructive empty:hidden">
        {state.error}
      </p>
    </section>
  );
}
