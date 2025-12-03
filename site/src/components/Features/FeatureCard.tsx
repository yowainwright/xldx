import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { FeatureCardProps } from "./types";

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="p-6">
      <CardHeader className="p-0">
        <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
