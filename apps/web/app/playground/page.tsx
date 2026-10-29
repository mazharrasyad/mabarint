import type { Metadata } from "next";
import { Playground } from "@/components/playground";
import { DEMOS } from "@/lib/demo";

export const metadata: Metadata = { title: "Playground" };

export default function PlaygroundPage() {
  return (
    <div className="wrap narrow">
      <p className="eyebrow">Playground</p>
      <h1>How should this be read?</h1>
      <p className="lead">
        Paste a paragraph from a story, a news article or a speech. Meta&apos;s Muse Spark reads it like a narrator and
        adds reading marks, so you can see which word to stress, where to pause and what the speaker feels.
      </p>
      <Playground presets={[DEMOS.home, DEMOS.alice, DEMOS.newsLibrary, DEMOS.script]} />
    </div>
  );
}
