import {
  CONTOURS, EMOTIONS, LEVELS, PAUSE_LENGTHS, RATES, SPAN_TYPES, VOLUMES,
  type Profile, type Span, type SpanType,
} from "@mabarint/types";
import { quotedRanges, sentences, wordCount } from "./segment";

export interface ValidationResult {
  spans: Span[];
  /** Problems the model should fix. Spans behind them are already dropped or corrected. */
  errors: string[];
  tone?: string;
  refused?: { reason: string };
}

const MAX_REASON_WORDS = 15;
const MAX_STRESS_WORDS = 3;
/** Point spans (pause) and spans that only shape delivery are allowed in news narration. */
const NEWS_NARRATION_TYPES: SpanType[] = ["pause", "tempo"];

/** Parses model output, tolerating code fences or prose around the JSON object. */
export function parseModelJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first >= 0 && last > first) return JSON.parse(raw.slice(first, last + 1));
    throw new Error("Response was not a JSON object");
  }
}

function occurrences(haystack: string, needle: string): number[] {
  const out: number[] = [];
  if (!needle) return out;
  for (let i = haystack.indexOf(needle); i >= 0; i = haystack.indexOf(needle, i + 1)) out.push(i);
  return out;
}

const normalizeQuotes = (s: string) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

/**
 * Finds `quote` in `text` and returns exact [start, end). LLM offsets are often
 * off, so the quote is the source of truth and `approx` only picks between
 * repeated occurrences. Falls back to quote-mark and case-insensitive matching,
 * then to the quote with surrounding punctuation trimmed.
 */
export function locate(text: string, quote: string, approx?: number): [number, number] | null {
  const candidates: Array<[string, string]> = [
    [text, quote],
    [normalizeQuotes(text), normalizeQuotes(quote)],
    [normalizeQuotes(text).toLowerCase(), normalizeQuotes(quote).toLowerCase()],
  ];
  const trimmed = quote.trim().replace(/^[\s"'“”‘’(]+|[\s"'“”‘’),;:]+$/g, "");
  if (trimmed && trimmed !== quote) candidates.push([normalizeQuotes(text).toLowerCase(), normalizeQuotes(trimmed).toLowerCase()]);

  for (const [hay, needle] of candidates) {
    const hits = occurrences(hay, needle);
    if (!hits.length) continue;
    const target = typeof approx === "number" && Number.isFinite(approx) ? approx : hits[0];
    const best = hits.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
    return [best, best + needle.length];
  }
  return null;
}

function trimReason(reason: unknown): string | undefined {
  if (typeof reason !== "string" || !reason.trim()) return undefined;
  const words = reason.trim().split(/\s+/);
  return words.length <= MAX_REASON_WORDS ? words.join(" ") : words.slice(0, MAX_REASON_WORDS).join(" ") + "…";
}

const inside = (ranges: Array<[number, number]>, s: number, e: number) =>
  ranges.some(([a, b]) => s >= a && e <= b);

/**
 * Validates one passage's model output against the v0.1 schema and Mabarint's
 * reading rules. Invalid spans are dropped, rule violations are trimmed, and
 * every problem is reported so the caller can ask the model to repair it.
 */
export function validatePassage(data: unknown, text: string, profile: Profile): ValidationResult {
  const errors: string[] = [];
  if (!data || typeof data !== "object") return { spans: [], errors: ["Top level must be a JSON object"] };
  const obj = data as Record<string, unknown>;

  if (obj.refused === true) {
    if (profile !== "news") errors.push(`Refusal is only allowed for the news profile, this is "${profile}"`);
    else return { spans: [], errors: [], refused: { reason: String(obj.reason ?? "Content is out of scope.") } };
  }
  if (!Array.isArray(obj.spans)) return { spans: [], errors: [...errors, '"spans" must be an array'] };

  const spans: Span[] = [];
  obj.spans.forEach((rawSpan, i) => {
    const s = (rawSpan ?? {}) as Record<string, any>;
    const label = `span ${i} (${s.type ?? "?"} "${String(s.quote ?? "").slice(0, 40)}")`;
    if (!SPAN_TYPES.includes(s.type)) return void errors.push(`${label}: unknown type`);
    if (typeof s.quote !== "string" || !s.quote) return void errors.push(`${label}: "quote" is required`);

    const at = locate(text, s.quote, typeof s.start === "number" ? s.start : undefined);
    if (!at) return void errors.push(`${label}: quote not found in PASSAGE, copy it exactly`);
    const [start, end] = at;
    const quote = text.slice(start, end);
    const reason = trimReason(s.reason);
    const base = { start, end, quote, ...(reason ? { reason } : {}) };

    switch (s.type as SpanType) {
      case "utterance": {
        if (!EMOTIONS.includes(s.emotion)) return void errors.push(`${label}: emotion must be one of ${EMOTIONS.join("|")}`);
        const intensity = typeof s.intensity === "number" ? Math.min(1, Math.max(0, s.intensity)) : undefined;
        spans.push({
          type: "utterance", ...base, emotion: s.emotion,
          ...(typeof s.speaker === "string" && s.speaker ? { speaker: s.speaker } : {}),
          ...(intensity !== undefined ? { intensity } : {}),
        });
        break;
      }
      case "stress":
      case "elongate": {
        const level = Number(s.level);
        if (!LEVELS.includes(level as any)) return void errors.push(`${label}: level must be 1, 2 or 3`);
        if (s.type === "stress" && wordCount(quote) > MAX_STRESS_WORDS)
          return void errors.push(`${label}: stress at most ${MAX_STRESS_WORDS} words, pick the key word`);
        spans.push({ type: s.type, ...base, level: level as 1 | 2 | 3 });
        break;
      }
      case "pause": {
        if (!PAUSE_LENGTHS.includes(s.length)) return void errors.push(`${label}: length must be short or long`);
        // The quote is the text before the pause; the pause sits right after it.
        spans.push({ type: "pause", start: end, end, length: s.length, ...(reason ? { reason } : {}) });
        break;
      }
      case "pitch":
        if (!CONTOURS.includes(s.contour)) return void errors.push(`${label}: contour must be rise, fall or rise-fall`);
        spans.push({ type: "pitch", ...base, contour: s.contour });
        break;
      case "tempo":
        if (!RATES.includes(s.rate)) return void errors.push(`${label}: rate must be slow, normal or fast`);
        spans.push({ type: "tempo", ...base, rate: s.rate });
        break;
      case "volume":
        if (!VOLUMES.includes(s.level)) return void errors.push(`${label}: level must be whisper, soft, normal, loud or shout`);
        spans.push({ type: "volume", ...base, level: s.level });
        break;
    }
  });

  let result = dedupe(spans);
  result = enforceUtterances(result, errors);
  result = enforceStressDensity(result, text, errors);
  if (profile === "news") result = enforceNewsNeutrality(result, text, errors);

  result.sort((a, b) => a.start - b.start || b.end - a.end);
  return { spans: result, errors, tone: typeof obj.tone === "string" ? obj.tone : undefined };
}

function dedupe(spans: Span[]): Span[] {
  const seen = new Set<string>();
  return spans.filter((s) => {
    const key = `${s.type}:${s.start}:${s.end}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** At most one emotion per utterance: overlapping utterance spans keep the first. */
function enforceUtterances(spans: Span[], errors: string[]): Span[] {
  const kept: Span[] = [];
  for (const s of spans) {
    if (s.type === "utterance") {
      const clash = kept.find((k) => k.type === "utterance" && s.start < k.end && k.start < s.end);
      if (clash) {
        errors.push(`utterance "${s.quote.slice(0, 40)}" overlaps another utterance, one emotion per piece of speech`);
        continue;
      }
    }
    kept.push(s);
  }
  return kept;
}

/** At most ~1 stress per 6 words in each sentence; extras with the lowest level are dropped. */
function enforceStressDensity(spans: Span[], text: string, errors: string[]): Span[] {
  const drop = new Set<Span>();
  for (const sentence of sentences(text)) {
    const s0 = sentence.start;
    const s1 = s0 + sentence.text.length;
    const allowed = Math.max(1, Math.ceil(wordCount(sentence.text) / 6));
    const stresses = spans.filter((s) => s.type === "stress" && s.start >= s0 && s.start < s1);
    if (stresses.length > allowed) {
      errors.push(`sentence "${sentence.text.slice(0, 50)}" has ${stresses.length} stresses, max ${allowed}`);
      stresses
        .sort((a, b) => (b as any).level - (a as any).level)
        .slice(allowed)
        .forEach((s) => drop.add(s));
    }
  }
  return spans.filter((s) => !drop.has(s));
}

/** News: the reporter's narration stays neutral; expressive spans only inside source quotations. */
function enforceNewsNeutrality(spans: Span[], text: string, errors: string[]): Span[] {
  const quoted = quotedRanges(text);
  return spans.filter((s) => {
    if (NEWS_NARRATION_TYPES.includes(s.type) || inside(quoted, s.start, s.end)) return true;
    if (s.type === "utterance" && s.emotion === "neutral") return true;
    errors.push(`news: ${s.type} "${(("quote" in s && s.quote) || "").slice(0, 40)}" is in reporter narration, only tempo/pause allowed outside quotations`);
    return false;
  });
}
