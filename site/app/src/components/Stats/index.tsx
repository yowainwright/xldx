import { Card, CardContent } from "@/components/ui/card";
import { CONTENT, STATS, STYLES } from "./constants";

export function Stats() {
  return (
    <section aria-labelledby="stats-heading" className={STYLES.section}>
      <h2 id="stats-heading" className="sr-only">
        {CONTENT.heading}
      </h2>
      <ul className={STYLES.list} role="list">
        {STATS.map((stat) => (
          <li key={stat.label}>
            <Card className={STYLES.card}>
              <CardContent className={STYLES.cardContent}>
                <stat.icon className={STYLES.icon} aria-hidden="true" />
                <data value={stat.value} className={STYLES.value}>
                  {stat.value}
                </data>
                <p className={STYLES.label}>{stat.label}</p>
                <p className={STYLES.description}>{stat.description}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

export type { Stat } from "./types";
