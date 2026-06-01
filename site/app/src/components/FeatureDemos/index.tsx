import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CodeBlock } from "@/components/CodeBlock";
import { CONTENT, DEMOS, STYLES } from "./constants";

export function FeatureDemos() {
  return (
    <section aria-labelledby="features-heading" className={STYLES.section}>
      <header className={STYLES.header}>
        <h2 id="features-heading" className={STYLES.heading}>
          {CONTENT.heading}
        </h2>
        <p className={STYLES.subheading}>{CONTENT.subheading}</p>
      </header>

      <Tabs defaultValue="basic" className={STYLES.tabs}>
        <TabsList className={STYLES.tabsList}>
          {DEMOS.map((demo) => (
            <TabsTrigger key={demo.id} value={demo.id}>
              {demo.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {DEMOS.map((demo) => (
          <TabsContent key={demo.id} value={demo.id}>
            <Card className={STYLES.card}>
              <CardHeader>
                <CardTitle>{demo.title}</CardTitle>
                <CardDescription>{demo.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <figure>
                  <CodeBlock language="typescript">{demo.code}</CodeBlock>
                </figure>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

export type { Demo } from "./types";
