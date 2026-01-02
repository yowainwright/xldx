import type { Worksheet } from "../xlsx/types";

export interface Relationship {
  readonly id: string;
  readonly type: string;
  readonly target: string;
}

export interface WorkbookContext {
  readonly worksheets: readonly Worksheet[];
  addFile(path: string, content: string | Uint8Array): void;
  getFile(path: string): string | Uint8Array | undefined;
}

export interface PluginReadContext {
  readonly files: ReadonlyMap<string, string | Uint8Array>;
  getFile(path: string): string | Uint8Array | undefined;
}

export interface XldxPlugin {
  readonly name: string;
  readonly version: string;

  /** Called before generating the XLSX file */
  beforeGenerate?(context: WorkbookContext): void;

  /** Called after generating all XML, before zipping */
  afterGenerate?(files: Map<string, string | Uint8Array>): void;

  /** Called when reading an XLSX file to extract plugin-specific data */
  parseContent?(context: PluginReadContext): unknown;

  /** Returns additional content type overrides for [Content_Types].xml */
  getContentTypes?(): readonly string[];

  /** Returns additional relationships for workbook.xml.rels */
  getRelationships?(): readonly Relationship[];
}
