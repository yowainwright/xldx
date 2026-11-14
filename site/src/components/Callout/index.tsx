import type { CalloutProps } from "./types";
import { CALLOUT_ICONS, DEFAULT_CALLOUT_TYPE } from "./constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function Callout({ type = DEFAULT_CALLOUT_TYPE, title, children }: CalloutProps) {
  const Icon = CALLOUT_ICONS[type];

  return (
    <Alert className="my-6">
      <Icon />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

export type { CalloutProps, CalloutType } from "./types";
