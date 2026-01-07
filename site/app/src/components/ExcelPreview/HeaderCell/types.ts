export interface HeaderCellProps {
  columnLetter: string;
  header: string;
  editable?: boolean;
  onChange?: (value: string) => void;
}
