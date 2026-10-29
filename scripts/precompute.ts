// Generates apps/web/public/demo-data/*.json with the real engine (Muse Spark),
// so demo pages load instantly and cost nothing per visit.
//   npm run precompute            all demos
//   npm run precompute -- alice   only ids containing "alice"
import { mkdir, writeFile } from "node:fs/promises";
import { createEngine } from "@mabarint/engine";
import { HOME, MEANINGS, MEANINGS_SENTENCE, NEWS, NEWS_REFUSAL, NOVELS, SCRIPT, type DemoSource } from "./demo-sources";

const OUT = "apps/web/public/demo-data";
const only = process.argv[2];
const engine = createEngine({ cacheDir: ".cache/annotations", effort: "medium", concurrency: 4 });

async function run(src: DemoSource) {
  if (only && !src.id.includes(only)) return;
  const t = Date.now();
  const annotation = await engine.annotate({ text: src.text, profile: src.profile, context: src.context });
  const { text: _, ...rest } = annotation as any;
  await writeFile(`${OUT}/${src.id}.json`, JSON.stringify({ ...src, annotation: { text: src.text, ...rest } }, null, 2));
  const n = "spans" in annotation ? annotation.spans.length : "refused";
  console.log(`${src.id.padEnd(14)} ${String(n).padStart(4)} spans  ${((Date.now() - t) / 1000).toFixed(1)}s  repairs=${annotation.meta?.repairs ?? 0}`);
}

await mkdir(OUT, { recursive: true });
await Promise.all([HOME, ...NOVELS, ...NEWS, NEWS_REFUSAL, SCRIPT].map(run));

if (!only || "meanings".includes(only)) {
  const variants = await Promise.all(MEANINGS.map(async (m) => {
    const annotation = await engine.annotate({ text: MEANINGS_SENTENCE, profile: "novel", context: m.context });
    const stress = "spans" in annotation ? annotation.spans.filter((s) => s.type === "stress").map((s) => (s as any).quote) : [];
    console.log(`meanings/${m.id.padEnd(6)} expected "${m.expect}", got [${stress.join(", ")}]`);
    return { ...m, annotation };
  }));
  await writeFile(`${OUT}/meanings.json`, JSON.stringify({ sentence: MEANINGS_SENTENCE, variants }, null, 2));
}
