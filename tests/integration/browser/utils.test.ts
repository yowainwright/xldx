import { mock } from "bun:test";
const click2 = mock(() => {});
export const mockElement = {
  href: "",
  download: "",
  click: click2,
};
const createElement = mock(() => mockElement);
const appendChild = mock(() => {});
const removeChild = mock(() => {});
const body2 = {
  appendChild: appendChild,
  removeChild: removeChild,
};
export const mockDocument = {
  createElement: createElement,
  body: body2,
};
const createObjectURL = mock(() => "blob:mock-url");
const revokeObjectURL = mock(() => {});
export const mockURL = {
  createObjectURL: createObjectURL,
  revokeObjectURL: revokeObjectURL,
};
export function setupDOMMocks() {
  Object.defineProperty(globalThis, "document", {
    value: mockDocument,
    configurable: true,
    writable: true,
  });
  globalThis.URL.createObjectURL = mockURL.createObjectURL;
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
