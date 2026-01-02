import type { Feature, Library } from "./types";

export const LIBRARIES: Library[] = ["xldx", "SheetJS", "ExcelJS"];

export const FEATURES: Feature[] = [
  {
    name: "Zero dependencies",
    support: { xldx: "yes", SheetJS: "no", ExcelJS: "no" },
  },
  {
    name: "Bundle size (gzipped)",
    support: { xldx: "yes", SheetJS: "no", ExcelJS: "no" },
  },
  {
    name: "Write performance",
    support: { xldx: "yes", SheetJS: "partial", ExcelJS: "partial" },
  },
  {
    name: "Browser support",
    support: { xldx: "yes", SheetJS: "yes", ExcelJS: "yes" },
  },
  {
    name: "Node.js support",
    support: { xldx: "yes", SheetJS: "yes", ExcelJS: "yes" },
  },
  {
    name: "Multiple sheets",
    support: { xldx: "yes", SheetJS: "yes", ExcelJS: "yes" },
  },
  {
    name: "Formulas",
    support: { xldx: "yes", SheetJS: "yes", ExcelJS: "yes" },
  },
  {
    name: "Merged cells",
    support: { xldx: "yes", SheetJS: "yes", ExcelJS: "yes" },
  },
  {
    name: "Frozen panes",
    support: { xldx: "yes", SheetJS: "yes", ExcelJS: "yes" },
  },
  {
    name: "Column widths / row heights",
    support: { xldx: "yes", SheetJS: "yes", ExcelJS: "yes" },
  },
  {
    name: "Cell borders & colors",
    support: { xldx: "partial", SheetJS: "yes", ExcelJS: "yes" },
  },
  {
    name: "Read existing files",
    support: { xldx: "partial", SheetJS: "yes", ExcelJS: "yes" },
  },
  {
    name: "Charts",
    support: { xldx: "no", SheetJS: "partial", ExcelJS: "yes" },
  },
  {
    name: "Images",
    support: { xldx: "no", SheetJS: "yes", ExcelJS: "yes" },
  },
  {
    name: "Conditional formatting",
    support: { xldx: "no", SheetJS: "yes", ExcelJS: "yes" },
  },
  {
    name: "Data validation",
    support: { xldx: "no", SheetJS: "yes", ExcelJS: "yes" },
  },
  {
    name: "Comments",
    support: { xldx: "no", SheetJS: "yes", ExcelJS: "yes" },
  },
];
