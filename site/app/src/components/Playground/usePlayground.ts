import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Column } from "@/components/ExcelPreview";
import { DEFAULT_DATA, DEFAULT_COLUMNS } from "./constants";

interface PlaygroundState {
  data: Record<string, unknown>[];
  columns: Column[];
}

interface XldxWithDownload {
  createSheet(options: { name: string }, ...columns: Column[]): void;
  download(filename: string): Promise<void>;
}

const PLAYGROUND_QUERY_KEY = ["playground-state"];

const DEFAULT_STATE: PlaygroundState = {
  data: DEFAULT_DATA,
  columns: DEFAULT_COLUMNS,
};

export function usePlayground() {
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: state = DEFAULT_STATE } = useQuery({
    queryKey: PLAYGROUND_QUERY_KEY,
    queryFn: () => DEFAULT_STATE,
    staleTime: Infinity,
  });

  const { mutate: updateState } = useMutation({
    mutationFn: async (newState: Partial<PlaygroundState>) => {
      return { ...state, ...newState };
    },
    onSuccess: (newState) => {
      queryClient.setQueryData(PLAYGROUND_QUERY_KEY, newState);
    },
  });

  const setData = useCallback(
    (newData: Record<string, unknown>[]) => {
      updateState({ data: newData });
    },
    [updateState],
  );

  const setColumns = useCallback(
    (newColumns: Column[]) => {
      updateState({ columns: newColumns });
    },
    [updateState],
  );

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const { Xldx } = await import("xldx/browser");
      const xldx = new Xldx(state.data) as XldxWithDownload;
      xldx.createSheet({ name: "Sheet1" }, ...state.columns);
      await xldx.download("spreadsheet.xlsx");
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [state.data, state.columns]);

  const jsonString = JSON.stringify(
    { data: state.data, columns: state.columns },
    null,
    2,
  );

  const handleJsonChange = useCallback(
    (json: string) => {
      try {
        const parsed = JSON.parse(json);
        const updates: Partial<PlaygroundState> = {};
        if (parsed.data) updates.data = parsed.data;
        if (parsed.columns) updates.columns = parsed.columns;
        if (Object.keys(updates).length > 0) {
          updateState(updates);
        }
      } catch {
        // Invalid JSON, ignore
      }
    },
    [updateState],
  );

  return {
    data: state.data,
    columns: state.columns,
    setData,
    setColumns,
    isDownloading,
    handleDownload,
    jsonString,
    handleJsonChange,
  };
}
