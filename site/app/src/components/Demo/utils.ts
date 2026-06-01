import { AUTH_STORAGE_KEY, WORKER_API_URL } from "./constants";
import type { AuthState } from "./types";

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getStoredAuth(): AuthState {
  if (typeof window === "undefined") {
    return { token: null, login: null };
  }

  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return { token: null, login: null };

  try {
    return JSON.parse(stored) as AuthState;
  } catch {
    return { token: null, login: null };
  }
}

export function setStoredAuth(auth: AuthState): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function openAuthPopup(): void {
  const width = 600;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  window.open(
    `${WORKER_API_URL}/auth/github`,
    "github-auth",
    `width=${width},height=${height},left=${left},top=${top}`,
  );
}

export async function generateInBrowser(): Promise<Blob> {
  const { Xldx } = await import("xldx");

  const data = [
    { label: "Generated in Browser", value: "" },
    { label: "Environment", value: "Browser (Main Thread)" },
    { label: "Timestamp", value: new Date().toISOString() },
  ];

  const xldx = new Xldx(data);
  xldx.createSheet(
    { name: "Demo" },
    { key: "label", header: "Label" },
    { key: "value", header: "Value" },
  );

  const xlsx = await xldx.toUint8Array();
  return new Blob([xlsx as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function generateInWorker(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const workerCode = `
      import { Xldx } from "xldx";

      self.onmessage = async () => {
        const data = [
          { label: "Generated in Web Worker", value: "" },
          { label: "Environment", value: "Browser (Worker Thread)" },
          { label: "Timestamp", value: new Date().toISOString() },
        ];

        const xldx = new Xldx(data);
        xldx.createSheet({ name: "Demo" }, { key: "label", header: "Label" }, { key: "value", header: "Value" });

        const xlsx = await xldx.toUint8Array();
        self.postMessage(xlsx, [xlsx.buffer]);
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob), { type: "module" });

    worker.onmessage = (e) => {
      const xlsx = e.data as Uint8Array;
      resolve(
        new Blob([xlsx as BlobPart], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );
      worker.terminate();
    };

    worker.onerror = (e) => {
      reject(new Error(e.message));
      worker.terminate();
    };

    worker.postMessage("generate");
  });
}

export async function generateOnNode(token: string): Promise<Blob> {
  const response = await fetch(`${WORKER_API_URL}/api/generate`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.blob();
}
