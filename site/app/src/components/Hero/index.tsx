import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { InstallCommand } from "@/components/InstallCommand";
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
            <Link to={primaryCta.href}>
              <ButtonContent label={primaryCta.label} icon={primaryCta.icon} />
            </Link>
          </Button>

          {secondaryCta && (
            <Button asChild variant="outline" size="lg">
              <Link to={secondaryCta.href}>
                <ButtonContent
                  label={secondaryCta.label}
                  icon={secondaryCta.icon}
                />
              </Link>
            </Button>
          )}
        </div>

        {installCommand && (
          <div className="mt-10 flex justify-center">
            <InstallCommand packageName={installCommand} />
          </div>
        )}
      </div>
    </section>
  );
}

export type { HeroProps, CtaButton } from "./types";
