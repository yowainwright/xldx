import { Check, X, Minus } from "lucide-react";
import { FEATURES, LIBRARIES } from "./constants";
import type { FeatureSupport } from "./types";

function SupportIcon({ support }: { support: FeatureSupport }) {
  if (support === "yes") return <Check className="h-5 w-5 text-green-500" />;
  if (support === "no") return <X className="h-5 w-5 text-red-500" />;
  return <Minus className="h-5 w-5 text-muted-foreground" />;
}

export function Comparison() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-bold">How xldx Compares</h2>
        <p className="mt-4 text-center text-muted-foreground">
          Honest comparison with other popular libraries.
        </p>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-medium">Feature</th>
                {LIBRARIES.map((lib) => (
                  <th key={lib} className="px-4 py-3 text-center font-medium">
                    {lib}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature) => (
                <tr key={feature.name} className="border-b">
                  <td className="py-3 text-muted-foreground">{feature.name}</td>
                  {LIBRARIES.map((lib) => (
                    <td key={lib} className="px-4 py-3 text-center">
                      <span className="inline-flex justify-center">
                        <SupportIcon support={feature.support[lib]} />
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 rounded-lg border border-border bg-muted/50 p-6">
          <h3 className="font-semibold">Who should use xldx?</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Projects that need fast, lightweight Excel generation</li>
            <li>• Browser-based export without large bundle overhead</li>
            <li>• High-volume data export where performance matters</li>
            <li>• Teams that want zero external dependencies</li>
          </ul>

          <h3 className="mt-6 font-semibold">When to use something else</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• You need charts, images, or pivot tables</li>
            <li>• You need to read and modify complex existing Excel files</li>
            <li>• You need advanced formatting like conditional formatting</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
