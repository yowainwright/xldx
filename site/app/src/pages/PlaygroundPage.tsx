import { Playground } from "@/components/Playground";

export function PlaygroundPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Playground</h1>
        <p className="mt-2 text-muted-foreground">
          Try xldx in your browser. Edit the code and click Run to generate an
          Excel file.
        </p>
      </div>

      <Playground title="Try xldx" />
    </div>
  );
}
