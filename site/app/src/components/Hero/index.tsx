import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { InstallCommand } from "@/components/InstallCommand";
import { ButtonContent } from "./ButtonContent";
import { STYLES } from "./constants";
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
    <header className={STYLES.header}>
      <hgroup className={STYLES.hgroup}>
        <h1 className={STYLES.heading}>
          {title}{" "}
          {highlight && <span className={STYLES.highlight}>{highlight}</span>}
        </h1>
        <p className={STYLES.description}>{description}</p>
      </hgroup>

      <nav className={STYLES.nav} aria-label="Primary">
        <Button asChild size="lg">
          <Link to={primaryCta.href}>
            <ButtonContent label={primaryCta.label} icon={primaryCta.icon} />
          </Link>
        </Button>

        {secondaryCta && (
          <Button asChild variant="outline" size="lg">
            <a
              href={secondaryCta.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ButtonContent
                label={secondaryCta.label}
                icon={secondaryCta.icon}
              />
            </a>
          </Button>
        )}
      </nav>

      {installCommand && (
        <figure className={STYLES.installFigure}>
          <InstallCommand packageName={installCommand} />
        </figure>
      )}
    </header>
  );
}

export type { HeroProps, CtaButton } from "./types";
