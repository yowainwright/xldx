import { mock } from "bun:test";

export const mockElement = {
  href: "",
  download: "",
  click: mock(() => {}),
};

export const mockDocument = {
  createElement: mock(() => mockElement),
  body: {
    appendChild: mock(() => {}),
    removeChild: mock(() => {}),
  },
};

export const mockURL = {
  createObjectURL: mock(() => "blob:mock-url"),
  revokeObjectURL: mock(() => {}),
};

export function setupDOMMocks() {
  // @ts-ignore
  globalThis.document = mockDocument;
  // @ts-ignore
  globalThis.URL.createObjectURL = mockURL.createObjectURL;
  // @ts-ignore
  globalThis.URL.revokeObjectURL = mockURL.revokeObjectURL;
}

export function resetMocks() {
  mockElement.href = "";
  mockElement.download = "";
  mockElement.click.mockClear();
  mockDocument.createElement.mockClear();
  mockDocument.body.appendChild.mockClear();
  mockDocument.body.removeChild.mockClear();
  mockURL.createObjectURL.mockClear();
  mockURL.revokeObjectURL.mockClear();
}
