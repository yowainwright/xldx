import { Textarea } from "@/components/ui/textarea";
import type { JsonEditorProps } from "./types";

export function JsonEditor({ value, onChange }: JsonEditorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    onChange(e.target.value);

  return (
    <Textarea
      value={value}
      onChange={handleChange}
      className="h-full min-h-full resize-none rounded-none border-0 font-mono text-sm shadow-none focus-visible:ring-0"
      spellCheck={false}
    />
  );
}

export type { JsonEditorProps } from "./types";
