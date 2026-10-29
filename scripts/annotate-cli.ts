// Usage: npm run annotate -- "text" [novel|news|script] [context]
import { createEngine } from "@mabarint/engine";

const [text, profile = "novel", context = ""] = process.argv.slice(2);
if (!text) {
  console.error('Usage: npm run annotate -- "your text" [novel|news|script] [context]');
  process.exit(1);
}

const engine = createEngine({ cacheDir: ".cache/annotations" });
const out = await engine.annotate({
  text, profile: profile as any, context,
  onProgress: (e) => console.error(`· ${e.message}`),
});
console.log(JSON.stringify(out, null, 2));
