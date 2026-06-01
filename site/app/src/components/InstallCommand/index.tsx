import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import {
  PACKAGE_MANAGERS,
  STORAGE_KEY,
  DEFAULT_PACKAGE_MANAGER,
  INSTALL_COMMANDS,
} from "./constants";
import type { InstallCommandProps, PackageManager } from "./types";

export function InstallCommand({ packageName }: InstallCommandProps) {
  const [packageManager, setPackageManager] = useState<PackageManager>(
    DEFAULT_PACKAGE_MANAGER,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as PackageManager | null;
    if (stored && PACKAGE_MANAGERS.includes(stored)) {
      setPackageManager(stored);
    }
  }, []);

  const handleSelect = (pm: PackageManager) => {
    setPackageManager(pm);
    localStorage.setItem(STORAGE_KEY, pm);
  };

  const command = `${INSTALL_COMMANDS[packageManager]} ${packageName}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-border">
      <div className="flex items-center gap-1 border-b border-border bg-muted/50 px-2">
        {PACKAGE_MANAGERS.map((pm) => (
          <button
            key={pm}
            onClick={() => handleSelect(pm)}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              packageManager === pm
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {pm}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between bg-muted px-4 py-3">
        <code className="text-sm">{command}</code>
        <button
          onClick={handleCopy}
          className="ml-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export type { InstallCommandProps, PackageManager } from "./types";
