import type { ExcelData } from "@/components/CodeExample/types";

export const FEATURES = [
  {
    title: "Zero Dependencies",
    description: "No external libraries. Just import and use.",
  },
  {
    title: "Lightweight",
    description: "Minimal bundle size for fast loading.",
  },
  {
    title: "Full XLSX Support",
    description: "Styling, multiple sheets, and patterns.",
  },
  {
    title: "Universal",
    description: "Works in browser and Node.js.",
  },
] as const;

export const EXAMPLE_CODE = `import { Xldx } from "xldx";

const data = [
  { name: "Alice", age: 30, city: "New York" },
  { name: "Bob", age: 25, city: "Los Angeles" },
];

const xldx = new Xldx(data);

xldx.createSheet(
  { name: "People" },
  { key: "name", header: "Name" },
  { key: "age", header: "Age" },
  { key: "city", header: "City" }
);

await xldx.download("people.xlsx");`;

export const EXAMPLE_EXCEL_PREVIEW: ExcelData = {
  columns: [
    { key: "name", header: "Name" },
    { key: "age", header: "Age" },
    { key: "city", header: "City" },
  ],
  rows: [
    { name: "Alice", age: 30, city: "New York" },
    { name: "Bob", age: 25, city: "Los Angeles" },
  ],
};
