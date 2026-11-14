import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormulaBarProps } from "../types";

export function FormulaBar({ selected, formula, error, onFormulaChange, onRun }: FormulaBarProps) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onRun();
  };
  const change: React.ChangeEventHandler<HTMLInputElement> = (event) =>
    onFormulaChange(event.target.value);
  const invalid = Boolean(error);
  return (
    <form onSubmit={submit} className="flex items-center gap-3 border-b p-3 sm:p-4">
      <output aria-label="Selected cell" className="w-10 shrink-0 font-mono text-xs">
        {selected}
      </output>
      <label
        htmlFor="spreadsheet-formula"
        className="font-serif text-lg italic text-muted-foreground"
      >
        fx
      </label>
      <Input
        id="spreadsheet-formula"
        value={formula}
        onChange={change}
        maxLength={8193}
        aria-label="Formula"
        aria-invalid={invalid}
        aria-describedby="formula-help formula-error"
        autoComplete="off"
        spellCheck={false}
        className="font-mono"
      />
      <Button type="submit">Run</Button>
    </form>
  );
}
