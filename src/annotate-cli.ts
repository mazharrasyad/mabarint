import { writeFileSync, mkdirSync } from "node:fs";
import { client, MODEL } from "./client.js";
import { SYSTEM_PROMPT, userPrompt } from "./prompt.js";

// Usage: npm run annotate -- "text" [profile] [name]
const [text, profile = "novel", name = "sample"] = process.argv.slice(2);
if (!text) {
  console.error('Usage: npm run annotate -- "your text" [novel|news|script] [name]');
  process.exit(1);
}

const res = await client.chat.completions.create({
  model: MODEL,
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt(text, profile) },
  ],
  // If the API rejects this, remove it and rely on the prompt (check docs for structured output).
  response_format: { type: "json_object" },
});

const raw = res.choices[0]?.message?.content ?? "";
let data: any;
try {
  data = JSON.parse(raw);
} catch {
  console.error("Model did not return valid JSON:\n", raw);
  process.exit(1);
}

// Quick check: does each quote match the text at its offsets?
for (const s of data.spans ?? []) {
  if (s.type === "pause") continue;
  const actual = text.slice(s.start, s.end);
  const ok = actual === s.quote;
  console.log(`${ok ? "OK " : "BAD"} ${s.type.padEnd(9)} "${s.quote}"${ok ? "" : ` (text has "${actual}")`}`);
}

mkdirSync("samples", { recursive: true });
writeFileSync(`samples/${name}.json`, JSON.stringify({ text, ...data }, null, 2));
console.log(`\nSaved samples/${name}.json`);
