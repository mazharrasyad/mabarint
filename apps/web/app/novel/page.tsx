import type { Metadata } from "next";
import { DemoCard } from "@/components/demo-card";
import { IntensityProvider, IntensityToggle, Legend } from "@/components/reader";
import { DEMOS } from "@/lib/demo";

export const metadata: Metadata = { title: "Novel" };

export default function NovelPage() {
  return (
    <IntensityProvider>
      <div className="wrap narrow">
        <p className="eyebrow">Demo · novel profile</p>
        <h1>Classic novels, read aloud in your head</h1>
        <p className="lead">
          Two public-domain scenes full of politeness that is not quite polite. Switch between Off, Subtle and Full,
          and hover a marked word to read Muse Spark&apos;s reasoning.
        </p>
        <div className="toolbar"><IntensityToggle /></div>
        <div style={{ display: "grid", gap: 20 }}>
          <DemoCard demo={DEMOS.alice} />
          <DemoCard demo={DEMOS.pride} />
        </div>
        <section className="section">
          <h2>Notation guide</h2>
          <div className="card"><Legend /></div>
        </section>
      </div>
    </IntensityProvider>
  );
}
