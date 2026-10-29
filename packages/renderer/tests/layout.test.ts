import { test } from "node:test";
import assert from "node:assert/strict";
import { layout, type TextPiece } from "../src/layout";
import type { Span } from "@mabarint/types";

const TEXT = '"Oh, wonderful," he muttered.';
const SPANS: Span[] = [
  { type: "utterance", start: 0, end: 16, quote: '"Oh, wonderful,"', emotion: "sarcasm", intensity: 0.8, reason: "Mock praise" },
  { type: "stress", start: 5, end: 14, quote: "wonderful", level: 3, reason: "False praise" },
  { type: "pitch", start: 5, end: 15, quote: "wonderful,", contour: "rise-fall" },
  { type: "pause", start: 16, end: 16, length: "short" },
];

const textOf = (pieces: ReturnType<typeof layout>) => pieces.filter((p): p is TextPiece => p.kind === "text").map((p) => p.text).join("");

test("layout never changes the words", () => {
  assert.equal(textOf(layout(TEXT, SPANS)), TEXT);
});

test("overlapping spans become one run with all classes", () => {
  const word = layout(TEXT, SPANS).find((p) => p.kind === "text" && p.text === "wonderful") as TextPiece;
  assert.ok(word.classes.includes("mbr-stress-3"));
  assert.ok(word.classes.includes("mbr-emo-sarcasm"));
  assert.ok(word.classes.includes("mbr-tail-rise-fall"));
  assert.equal(word.tips.length, 2);
});

test("markers sit at their offsets: pitch glyph then pause", () => {
  const pieces = layout(TEXT, SPANS);
  const kinds = pieces.map((p) => (p.kind === "text" ? p.text : `<${p.kind}>`));
  assert.ok(kinds.join("|").includes(',|<pitch>|"|<pause>|'), kinds.join("|"));
});

test("out-of-range spans are ignored", () => {
  const pieces = layout("short", [{ type: "stress", start: 3, end: 99, quote: "x", level: 1 }]);
  assert.equal(textOf(pieces), "short");
  assert.equal((pieces[0] as TextPiece).classes.length, 0);
});

test("plain text with no spans is one run", () => {
  assert.equal(layout("hello", []).length, 1);
});
