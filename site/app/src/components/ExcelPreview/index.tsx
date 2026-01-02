import { Table } from "@/components/ui/table";
import { TableHeader } from "./TableHeader";
import { TableBody } from "./TableBody";
import { useExcelPreview } from "./useExcelPreview";
import type { ExcelPreviewProps } from "./types";

export function ExcelPreview({
  data,
  columns,
  onDataChange,
  onColumnsChange,
  editable = true,
}: ExcelPreviewProps) {
  const {
    handleCellChange,
    handleHeaderChange,
    handleAddRow,
    handleAddColumn,
    addRowColSpan,
  } = useExcelPreview({ data, columns, onDataChange, onColumnsChange });

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader
          columns={columns}
          editable={editable}
          onHeaderChange={handleHeaderChange}
          onAddColumn={handleAddColumn}
        />
        <TableBody
          data={data}
          columns={columns}
          editable={editable}
          onCellChange={handleCellChange}
          onAddRow={handleAddRow}
          addRowColSpan={addRowColSpan}
        />
      </Table>
    </div>
  );
}

export type { ExcelPreviewProps, Column } from "./types";
