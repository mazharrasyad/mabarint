import type { Metadata } from "next";
import { Playground } from "@/components/playground";
import { DEMOS } from "@/lib/demo";

export const metadata: Metadata = { title: "Playground" };

export default function PlaygroundPage() {
  return (
    <div className="wrap narrow">
      <p className="eyebrow">Live</p>
      <h1>Playground</h1>
      <p className="lead">
        Paste up to 1,000 characters and let Muse Spark annotate it. It first detects whether your text is a story,
        news or a read-aloud script, then you see each step of the engine: reading, validating, and repairing when a
        span fails the checks.
      </p>
      <Playground presets={[DEMOS.home, DEMOS.alice, DEMOS.newsLibrary, DEMOS.script]} />
    </div>
  );
}
