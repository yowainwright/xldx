import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTENT, REASONS, STYLES } from "./constants";

export function WhySection() {
  return (
    <section aria-labelledby="why-heading" className={STYLES.section}>
      <header className={STYLES.header}>
        <h2 id="why-heading" className={STYLES.heading}>
          {CONTENT.heading}
        </h2>
        <p className={STYLES.subheading}>{CONTENT.subheading}</p>
      </header>

      <ul className={STYLES.list} role="list">
        {REASONS.map((reason) => (
          <li key={reason.title}>
            <Card className={STYLES.card}>
              <CardHeader className={STYLES.cardHeader}>
                <figure className={STYLES.iconFigure} aria-hidden="true">
                  <reason.icon className={STYLES.icon} />
                </figure>
                <CardTitle className={STYLES.cardTitle}>
                  {reason.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={STYLES.description}>{reason.description}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

export type { Reason } from "./types";
