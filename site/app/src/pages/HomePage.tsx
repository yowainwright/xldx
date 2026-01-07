import { Hero } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { FeatureDemos } from "@/components/FeatureDemos";
import { WhySection } from "@/components/WhySection";
import { Demo } from "@/components/Demo";
import { Comparison } from "@/components/Comparison";

export function HomePage() {
  return (
    <main>
      <Hero
        title="The Fastest, Lightest"
        highlight="Excel Generator"
        description="Create XLSX files with zero dependencies. Under 17KB. Works everywhere."
        primaryCta={{ label: "Get Started", href: "/docs" }}
        secondaryCta={{
          label: "GitHub",
          href: "https://github.com/yowainwright/xldx",
        }}
        installCommand="xldx"
      />

      <Stats />

      <FeatureDemos />

      <WhySection />

      <Demo />

      <Comparison />
    </main>
  );
}
