export type NavigationDirection = "next" | "down";

export interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onNavigate?: (direction: NavigationDirection) => void;
}

export interface CellProps {
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  onNavigate?: (direction: NavigationDirection) => void;
}
