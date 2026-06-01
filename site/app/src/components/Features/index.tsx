import { FeatureCard } from "./FeatureCard";
import type { FeaturesProps } from "./types";

export function Features({ title, features }: FeaturesProps) {
  return (
    <section className="border-t bg-muted/50 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold">{title}</h2>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

export type { FeaturesProps, Feature, FeatureCardProps } from "./types";
