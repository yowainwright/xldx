export interface GridProps {
  data: unknown[][];
  selected: { row: number; column: number };
  editing: boolean;
  draft: string;
  onSelect: (row: number, column: number) => void;
  onEdit: (row: number, column: number) => void;
  onDraftChange: (input: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}

export interface FormulaBarProps {
  selected: string;
  formula: string;
  error: string | undefined;
  onFormulaChange: (formula: string) => void;
  onRun: () => void;
}
