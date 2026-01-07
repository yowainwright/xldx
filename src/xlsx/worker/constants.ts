export const SHARED_STRING_CELL_REGEX =
  /<c r="([^"]+)" t="s"><v>(\d+)<\/v><\/c>/g;

export function sharedStringCell(ref: string, index: number): string {
  return `<c r="${ref}" t="s"><v>${index}</v></c>`;
}
