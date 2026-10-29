import type { Metadata } from "next";
import { DemoCard } from "@/components/demo-card";
import { IntensityProvider, IntensityToggle } from "@/components/reader";
import { DEMOS } from "@/lib/demo";

export const metadata: Metadata = { title: "News" };

export default function NewsPage() {
  return (
    <IntensityProvider>
      <div className="wrap narrow">
        <p className="eyebrow">Demo · news profile</p>
        <h1>News: the voices carry feeling, the reporter stays neutral</h1>
        <p className="lead">
          In the news profile, emotion and stress are only allowed inside quotations from sources. The reporter&apos;s
          narration gets pauses and tempo only. The engine enforces this rule after Muse Spark answers, and political
          or war stories are refused.
        </p>
        <div className="toolbar"><IntensityToggle /></div>
        <div style={{ display: "grid", gap: 20 }}>
          <DemoCard demo={DEMOS.newsLibrary} />
          <DemoCard demo={DEMOS.newsBakery} />
          <DemoCard demo={DEMOS.newsRefusal} />
        </div>
      </div>
    </IntensityProvider>
  );
}
