import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlaygroundToolbarProps } from "./types";

export function PlaygroundToolbar({ isDownloading, onDownload }: PlaygroundToolbarProps) {
  const buttonLabel = isDownloading ? "Downloading..." : "Download";

  return (
    <Button onClick={onDownload} disabled={isDownloading} size="sm" className="gap-2">
      <Download className="h-4 w-4" />
      {buttonLabel}
    </Button>
  );
}

export type { PlaygroundToolbarProps } from "./types";
