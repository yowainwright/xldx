import { ArrowRight, Download, FileSpreadsheet, Zap, Package } from "lucide-react";
import { Header, Footer, Hero, Features, CodeExample } from "@/components";
import type { Feature } from "@/components/Features/types";

const FEATURES: Feature[] = [
  {
    icon: <Package className="h-6 w-6" />,
    title: "Zero Dependencies",
    description: "No external libraries. Just import and use.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Lightweight",
    description: "Minimal bundle size for fast loading.",
  },
  {
    icon: <FileSpreadsheet className="h-6 w-6" />,
    title: "Full XLSX Support",
    description: "Styling, multiple sheets, and patterns.",
  },
  {
    icon: <Download className="h-6 w-6" />,
    title: "Universal",
    description: "Works in browser and Node.js.",
  },
];

const EXAMPLE_CODE = `import { Xldx } from "xldx";

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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <Hero
          title="Generate Excel files with"
          highlight="zero dependencies"
          description="xldx is a lightweight, type-safe library for creating XLSX files in the browser and Node.js. No external dependencies, just pure JavaScript."
          primaryCta={{
            label: "Get Started",
            href: "/docs",
            icon: <ArrowRight className="h-4 w-4" />,
          }}
          secondaryCta={{
            label: "Try Playground",
            href: "/playground",
          }}
          installCommand="npm install xldx"
        />

        <Features title="Why xldx?" features={FEATURES} />

        <CodeExample
          title="Simple to Use"
          description="Create Excel files in just a few lines of code."
          code={EXAMPLE_CODE}
          filename="example.ts"
        />
      </main>

      <Footer />
    </div>
  );
}
