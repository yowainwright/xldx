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
    support: { xldx: "yes", SheetJS: "yes", ExcelJS: "yes" },
  },
  {
    name: "Charts",
    support: { xldx: "yes", SheetJS: "partial", ExcelJS: "yes" },
    note: "via @xldx/chart-hooks",
  },
  {
    name: "Images",
    support: { xldx: "yes", SheetJS: "yes", ExcelJS: "yes" },
    note: "via @xldx/images",
  },
  {
    name: "Conditional formatting",
    support: { xldx: "yes", SheetJS: "yes", ExcelJS: "yes" },
    note: "via @xldx/conditional-formatting",
  },
  {
    name: "Data validation",
    support: { xldx: "yes", SheetJS: "yes", ExcelJS: "yes" },
    note: "via @xldx/validation",
  },
  {
    name: "Comments",
    support: { xldx: "yes", SheetJS: "yes", ExcelJS: "yes" },
    note: "via @xldx/comments",
  },
];
