import type { ReactNode } from "react";

export interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

export interface FeaturesProps {
  title: string;
  features: Feature[];
}

export interface FeatureCardProps extends Feature {}
