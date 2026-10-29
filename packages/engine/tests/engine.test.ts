import { test } from "node:test";
import assert from "node:assert/strict";
import { createEngine, locate, paragraphs, validatePassage, type ChatMessage } from "../src/index";

const GRIEF = '"No," she whispered. "He was fine this morning."';

test("locate recomputes offsets from the quote, not the model's numbers", () => {
  assert.deepEqual(locate(GRIEF, "fine", 3), [29, 33]);
  assert.equal(GRIEF.slice(29, 33), "fine");
});

test("locate picks the occurrence nearest the approximate offset", () => {
  const text = "No. No. No!";
  assert.deepEqual(locate(text, "No", 8), [8, 10]);
  assert.deepEqual(locate(text, "No", 0), [0, 2]);
});

test("locate tolerates curly vs straight quotes and case", () => {
  const text = "“Stop,” he said.";
  const at = locate(text, '"stop,"');
  assert.ok(at);
  assert.equal(text.slice(...at), "“Stop,”");
});

test("paragraphs keep original offsets", () => {
  const text = "First line.\n\n  Second para.\nStill second.";
  const segs = paragraphs(text);
  assert.equal(segs.length, 2);
  assert.equal(text.slice(segs[1].start, segs[1].start + segs[1].text.length), segs[1].text);
});

test("valid spans pass and pause sits after its quote", () => {
  const r = validatePassage({
    tone: "grief",
    spans: [
      { type: "utterance", quote: '"No,"', emotion: "sadness", intensity: 1.4, speaker: "she" },
      { type: "pause", quote: "whispered.", length: "long" },
      { type: "stress", quote: "fine", level: 2, reason: "Contrast with now" },
    ],
  }, GRIEF, "novel");
  assert.deepEqual(r.errors, []);
  const pause = r.spans.find((s) => s.type === "pause")!;
  assert.equal(pause.start, GRIEF.indexOf("whispered.") + "whispered.".length);
  assert.equal(pause.start, pause.end);
  const utt = r.spans.find((s) => s.type === "utterance") as any;
  assert.equal(utt.intensity, 1, "intensity is clamped");
});

test("unknown quote, bad enum and unknown type are reported and dropped", () => {
  const r = validatePassage({
    spans: [
      { type: "stress", quote: "banana", level: 1 },
      { type: "utterance", quote: '"No,"', emotion: "rage" },
      { type: "wink", quote: "No" },
    ],
  }, GRIEF, "novel");
  assert.equal(r.spans.length, 0);
  assert.equal(r.errors.length, 3);
});

test("stress density: at most ~1 per 6 words per sentence", () => {
  const r = validatePassage({
    spans: [
      { type: "stress", quote: "He", level: 1 },
      { type: "stress", quote: "was", level: 1 },
      { type: "stress", quote: "fine", level: 3 },
    ],
  }, GRIEF, "novel");
  assert.equal(r.spans.filter((s) => s.type === "stress").length, 1);
  assert.equal((r.spans[0] as any).quote, "fine", "keeps the strongest stress");
  assert.equal(r.errors.length, 1);
});

test("one emotion per utterance", () => {
  const r = validatePassage({
    spans: [
      { type: "utterance", quote: '"He was fine this morning."', emotion: "sadness" },
      { type: "utterance", quote: "He was fine", emotion: "fear" },
    ],
  }, GRIEF, "novel");
  assert.equal(r.spans.length, 1);
  assert.equal(r.errors.length, 1);
});

test("news: narration stays neutral, quotes may carry emotion", () => {
  const text = 'The library reopened on Monday. "We cried with joy," said the head librarian.';
  const r = validatePassage({
    spans: [
      { type: "stress", quote: "reopened", level: 2 },
      { type: "tempo", quote: "The library reopened on Monday.", rate: "slow" },
      { type: "utterance", quote: '"We cried with joy,"', emotion: "joy" },
    ],
  }, text, "news");
  assert.deepEqual(r.spans.map((s) => s.type).sort(), ["tempo", "utterance"]);
  assert.equal(r.errors.length, 1);
});

test("news refusal passes through; novel refusal is an error", () => {
  assert.ok(validatePassage({ refused: true, reason: "Politics" }, "x", "news").refused);
  assert.equal(validatePassage({ refused: true, reason: "x" }, "x", "novel").errors.length, 2);
});

test("reasons are capped at 15 words", () => {
  const r = validatePassage({
    spans: [{ type: "stress", quote: "fine", level: 1, reason: "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen" }],
  }, GRIEF, "novel");
  assert.equal((r.spans[0] as any).reason.split(" ").length, 15);
});

test("engine repairs once, then caches", async () => {
  const replies = [
    JSON.stringify({ spans: [{ type: "stress", quote: "fien", level: 2 }] }),
    JSON.stringify({ tone: "grief", spans: [{ type: "stress", quote: "fine", level: 2 }] }),
  ];
  const seen: ChatMessage[][] = [];
  const engine = createEngine({
    complete: async (messages) => {
      seen.push(messages);
      return replies.shift()!;
    },
  });
  const stages: string[] = [];
  const out: any = await engine.annotate({ text: GRIEF, onProgress: (e) => stages.push(e.stage) });
  assert.equal(out.spans.length, 1);
  assert.equal(out.spans[0].quote, "fine");
  assert.equal(out.meta.calls, 2);
  assert.equal(out.meta.repairs, 1);
  assert.match(seen[1].at(-1)!.content, /quote not found/);
  assert.ok(stages.includes("repair"));

  const again: any = await engine.annotate({ text: GRIEF });
  assert.equal(again.meta.cached, true);
  assert.equal(seen.length, 2, "no extra model call on cache hit");
});

test("engine maps paragraph offsets back to the full text", async () => {
  const text = "Calm first paragraph.\n\nShe said \"never\" twice.";
  const engine = createEngine({
    complete: async (messages) => {
      const passage = messages[1].content.split("PASSAGE (annotate this):\n")[1];
      return JSON.stringify({ spans: passage.includes("never") ? [{ type: "stress", quote: "never", level: 2 }] : [] });
    },
  });
  const out: any = await engine.annotate({ text });
  assert.equal(text.slice(out.spans[0].start, out.spans[0].end), "never");
});

test("engine gives up after max repairs and keeps the best attempt", async () => {
  let calls = 0;
  const engine = createEngine({
    maxRepairs: 2,
    complete: async () => {
      calls++;
      return calls === 1 ? "not json" : JSON.stringify({ spans: [{ type: "stress", quote: "fine", level: 1 }, { type: "stress", quote: "zzz", level: 1 }] });
    },
  });
  const out: any = await engine.annotate({ text: GRIEF });
  assert.equal(calls, 3);
  assert.equal(out.spans.length, 1);
  assert.equal(out.meta.dropped, 1);
});
