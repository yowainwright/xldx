"use client";

import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ExcelPreview } from "@/components/ExcelPreview";
import { PlaygroundToolbar } from "./PlaygroundToolbar";
import { JsonEditor } from "./JsonEditor";
import { usePlayground } from "./usePlayground";
import { DEFAULT_TITLE } from "./constants";
import type { PlaygroundProps } from "./types";

export function Playground({ title = DEFAULT_TITLE }: PlaygroundProps) {
  const {
    data,
    columns,
    setData,
    setColumns,
    isDownloading,
    handleDownload,
    jsonString,
    handleJsonChange,
  } = usePlayground();

  return (
    <Card className="my-8 gap-0 py-0">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <PlaygroundToolbar isDownloading={isDownloading} onDownload={handleDownload} />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>Excel Preview</Label>
          <ExcelPreview
            data={data}
            columns={columns}
            onDataChange={setData}
            onColumnsChange={setColumns}
          />
        </div>
        <div className="space-y-2">
          <Label>JSON Data</Label>
          <Card className="h-[300px] gap-0 overflow-hidden p-0">
            <JsonEditor value={jsonString} onChange={handleJsonChange} />
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

export type { PlaygroundProps } from "./types";
