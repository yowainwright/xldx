import type { ReactNode } from "react";

export interface CtaButton {
  label: string;
  href: string;
  icon?: ReactNode;
}

export interface HeroProps {
  title: string;
  highlight: string;
  description: string;
  primaryCta: CtaButton;
  secondaryCta?: CtaButton;
  installCommand?: string;
}
