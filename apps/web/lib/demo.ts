import type { Annotation, AnnotationResult, Profile, StressSpan } from "@mabarint/types";
import home from "@/public/demo-data/home.json";
import alice from "@/public/demo-data/alice.json";
import pride from "@/public/demo-data/pride.json";
import newsLibrary from "@/public/demo-data/news-library.json";
import newsBakery from "@/public/demo-data/news-bakery.json";
import newsRefusal from "@/public/demo-data/news-refusal.json";
import script from "@/public/demo-data/script.json";
import meanings from "@/public/demo-data/meanings.json";

/** A precomputed demo: the source text plus the engine's annotation (see scripts/precompute.ts). */
export interface Demo {
  id: string;
  title: string;
  credit: string;
  profile: Profile;
  text: string;
  context?: string;
  annotation: AnnotationResult & { text?: string };
}

export const DEMOS = {
  home: home as Demo,
  alice: alice as Demo,
  pride: pride as Demo,
  newsLibrary: newsLibrary as Demo,
  newsBakery: newsBakery as Demo,
  newsRefusal: newsRefusal as Demo,
  script: script as Demo,
};

export const MEANINGS = meanings as {
  sentence: string;
  variants: Array<{ id: string; expect: string; context: string; annotation: Annotation }>;
};

export function spansOf(demo: Demo) {
  return "spans" in demo.annotation ? demo.annotation.spans : [];
}

export function mainStress(a: Annotation): StressSpan | undefined {
  return a.spans.filter((s): s is StressSpan => s.type === "stress").sort((x, y) => y.level - x.level)[0];
}
