export type FeatureSupport = "yes" | "no" | "partial";

export type Library = "xldx" | "SheetJS" | "ExcelJS";

export interface Feature {
  name: string;
  support: Record<Library, FeatureSupport>;
}
