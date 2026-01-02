import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { CodeExample } from "@/components/CodeExample";
import { Demo } from "@/components/Demo";
import { FEATURES, EXAMPLE_CODE, EXAMPLE_EXCEL_PREVIEW } from "./constants";
import { Package, Feather, FileSpreadsheet, Globe } from "lucide-react";

const featuresWithIcons = [
  { ...FEATURES[0], icon: <Package className="h-6 w-6" /> },
  { ...FEATURES[1], icon: <Feather className="h-6 w-6" /> },
  { ...FEATURES[2], icon: <FileSpreadsheet className="h-6 w-6" /> },
  { ...FEATURES[3], icon: <Globe className="h-6 w-6" /> },
];

export function HomePage() {
  return (
    <>
      <Hero
        title="xldx"
        highlight=""
        description="A lightweight, dependency-free library for generating XLSX files in the browser and Node.js."
        primaryCta={{ label: "Get Started", href: "/docs" }}
        secondaryCta={{
          label: "GitHub",
          href: "https://github.com/yowainwright/xldx",
        }}
        installCommand="xldx"
      />

      <Features title="Why xldx?" features={featuresWithIcons} />

      <CodeExample
        title="Simple to Use"
        description="Create Excel files in just a few lines of code."
        code={EXAMPLE_CODE}
        filename="example.ts"
        excelPreview={EXAMPLE_EXCEL_PREVIEW}
      />

      <Demo />
    </>
  );
}
