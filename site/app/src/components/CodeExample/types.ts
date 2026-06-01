export interface ExcelData {
  columns: { key: string; header: string }[];
  rows: Record<string, unknown>[];
}

export interface CodeExampleProps {
  title: string;
  description?: string;
  code: string;
  filename?: string;
  excelPreview?: ExcelData;
}
