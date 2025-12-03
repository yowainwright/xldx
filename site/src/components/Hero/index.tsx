import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { ButtonContent } from "./ButtonContent";
import type { HeroProps } from "./types";

export function Hero({
  title,
  highlight,
  description,
  primaryCta,
  secondaryCta,
  installCommand,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          {title} <span className="text-primary">{highlight}</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">{description}</p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <NextLink href={primaryCta.href}>
              <ButtonContent label={primaryCta.label} icon={primaryCta.icon} />
            </NextLink>
          </Button>

          {secondaryCta && (
            <Button asChild variant="outline" size="lg">
              <NextLink href={secondaryCta.href}>
                <ButtonContent label={secondaryCta.label} icon={secondaryCta.icon} />
              </NextLink>
            </Button>
          )}
        </div>

        {installCommand && (
          <div className="mt-10">
            <code className="rounded-lg bg-muted px-4 py-2 text-sm">{installCommand}</code>
          </div>
        )}
      </div>
    </section>
  );
}

export type { HeroProps, CtaButton } from "./types";
