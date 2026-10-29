import OpenAI from "openai";
import {
  PROFILES, SCHEMA_VERSION,
  type Annotation, type AnnotationResult, type Profile, type Refusal, type Span,
} from "@mabarint/types";
import { AnnotationCache, cacheKey } from "./cache";
import { DETECT_PROMPT, SYSTEM_PROMPT, repairPrompt, userPrompt } from "./prompt";
import { paragraphs, type Segment } from "./segment";
import { parseModelJson, validatePassage, type ValidationResult } from "./validate";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
/** Sends a chat to the model and returns the raw text reply. Swappable for tests. */
export type CompleteFn = (messages: ChatMessage[], signal?: AbortSignal) => Promise<string>;

export type ReasoningEffort = "low" | "medium" | "high";

export interface EngineConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  effort?: ReasoningEffort;
  /** Directory for the persistent cache; omit for memory only. */
  cacheDir?: string;
  /** Repair rounds after the first answer (the brief's verifiable loop). */
  maxRepairs?: number;
  /** Paragraphs annotated in parallel. */
  concurrency?: number;
  timeoutMs?: number;
  complete?: CompleteFn;
}

export type ProgressStage = "cache" | "detect" | "segment" | "model" | "validate" | "repair" | "merge" | "done";
export interface ProgressEvent {
  stage: ProgressStage;
  message: string;
  paragraph?: number;
  paragraphs?: number;
}

export interface AnnotateRequest {
  text: string;
  /** "auto" lets Muse Spark detect novel, news or script first. Defaults to "novel". */
  profile?: Profile | "auto";
  lang?: string;
  /** Preceding text that informs the reading but is not annotated. */
  context?: string;
  onProgress?: (e: ProgressEvent) => void;
  signal?: AbortSignal;
}

const CONTEXT_CHARS = 1200;

export function createEngine(config: EngineConfig = {}) {
  const model = config.model ?? process.env.META_MODEL ?? "muse-spark-1.3";
  const effort = config.effort ?? (process.env.META_REASONING_EFFORT as ReasoningEffort) ?? "low";
  const maxRepairs = config.maxRepairs ?? 2;
  const concurrency = config.concurrency ?? 3;
  const cache = new AnnotationCache(config.cacheDir);
  const complete = config.complete ?? metaComplete({ ...config, model, effort });

  async function annotatePassage(
    seg: Segment, index: number, total: number, req: AnnotateRequest & { profile: Profile; lang: string },
    context: string, stats: { calls: number; repairs: number; issues: string[] },
  ): Promise<ValidationResult> {
    const where = total > 1 ? ` (paragraph ${index + 1}/${total})` : "";
    const progress = (stage: ProgressStage, message: string) =>
      req.onProgress?.({ stage, message: message + where, paragraph: index + 1, paragraphs: total });

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt(seg.text, req.profile, req.lang, context) },
    ];
    let best: ValidationResult | null = null;

    for (let attempt = 0; attempt <= maxRepairs; attempt++) {
      progress(attempt ? "repair" : "model", attempt ? `Muse Spark is repairing its annotation (${attempt}/${maxRepairs})` : "Muse Spark is reading the context");
      stats.calls++;
      if (attempt) stats.repairs++;
      const raw = await complete(messages, req.signal);

      progress("validate", "Validating offsets, schema and reading rules");
      let result: ValidationResult;
      try {
        result = validatePassage(parseModelJson(raw), seg.text, req.profile);
      } catch (e) {
        result = { spans: [], errors: [(e as Error).message] };
      }
      if (!best || result.refused || isBetter(result, best)) best = result;
      if (result.refused || !result.errors.length) break;

      stats.issues.push(...result.errors);
      messages.push({ role: "assistant", content: raw }, { role: "user", content: repairPrompt(result.errors) });
    }
    return best!;
  }

  /** Asks Muse Spark whether the text is a story, news or a script. Falls back to novel. */
  async function detectProfile(text: string, signal: AbortSignal | undefined, stats: { calls: number }) {
    stats.calls++;
    try {
      const raw = await complete([
        { role: "system", content: DETECT_PROMPT },
        { role: "user", content: text.slice(0, 2000) },
      ], signal);
      const data = parseModelJson(raw) as { profile?: string; reason?: string };
      if (PROFILES.includes(data.profile as Profile)) {
        const reason = String(data.reason ?? "").split(/\s+/).slice(0, 12).join(" ");
        return { profile: data.profile as Profile, reason };
      }
    } catch (e) {
      if (signal?.aborted) throw e;
    }
    return { profile: "novel" as Profile, reason: "Type unclear, read as a story." };
  }

  async function annotate(input: AnnotateRequest): Promise<AnnotationResult> {
    const started = Date.now();
    const requested = input.profile ?? "novel";
    if (requested !== "auto" && !PROFILES.includes(requested)) throw new Error(`Unknown profile "${requested}"`);
    const lang = input.lang ?? "en";
    const context = input.context ?? "";
    const text = input.text;

    const key = cacheKey({ text, profile: requested, lang, context, v: SCHEMA_VERSION, model, effort, prompt: SYSTEM_PROMPT, detect: DETECT_PROMPT });
    const cached = await cache.get(key);
    if (cached) {
      input.onProgress?.({ stage: "cache", message: "Loaded from cache" });
      input.onProgress?.({ stage: "done", message: "Done" });
      return { ...cached, meta: { ...cached.meta, cached: true } };
    }

    const stats = { calls: 0, repairs: 0, issues: [] as string[] };
    let detected: { profile: Profile; reason: string } | undefined;
    if (requested === "auto") {
      input.onProgress?.({ stage: "detect", message: "Muse Spark is detecting the type of text" });
      detected = await detectProfile(text, input.signal, stats);
      input.onProgress?.({ stage: "detect", message: `Detected: ${PROFILE_LABEL[detected.profile]}${detected.reason ? ` (${detected.reason.replace(/\.$/, "")})` : ""}` });
    }
    const req = { ...input, profile: detected?.profile ?? (requested as Profile), lang, context };

    const segs = paragraphs(text);
    req.onProgress?.({ stage: "segment", message: `Split into ${segs.length} paragraph${segs.length === 1 ? "" : "s"}`, paragraphs: segs.length });

    const results: ValidationResult[] = new Array(segs.length);
    let next = 0;
    const worker = async () => {
      while (next < segs.length) {
        const i = next++;
        // Each paragraph sees the caller's context plus the paragraphs before it.
        const before = (req.context + "\n\n" + text.slice(0, segs[i].start)).trim().slice(-CONTEXT_CHARS);
        results[i] = await annotatePassage(segs[i], i, segs.length, req, before, stats);
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, segs.length) }, worker));

    const meta = {
      model, calls: stats.calls, repairs: stats.repairs, ms: Date.now() - started,
      ...(detected ? { detectedProfile: detected.profile, detectReason: detected.reason } : {}),
    };
    const refused = results.find((r) => r.refused);
    let out: AnnotationResult;
    if (refused) {
      out = { version: SCHEMA_VERSION, profile: req.profile, refused: true, reason: refused.refused!.reason, meta } satisfies Refusal;
    } else {
      req.onProgress?.({ stage: "merge", message: "Merging paragraphs" });
      const spans: Span[] = results.flatMap((r, i) =>
        r.spans.map((s) => ({ ...s, start: s.start + segs[i].start, end: s.end + segs[i].start })),
      );
      const remaining = results.reduce((n, r) => n + r.errors.length, 0);
      out = {
        version: SCHEMA_VERSION, profile: req.profile, lang: req.lang, text,
        tone: majority(results.map((r) => r.tone).filter(Boolean) as string[]),
        spans,
        meta: { ...meta, dropped: remaining, issues: stats.issues.slice(0, 20) },
      } satisfies Annotation;
    }
    await cache.set(key, out);
    req.onProgress?.({ stage: "done", message: "Done" });
    return out;
  }

  return { annotate, model, effort };
}

const PROFILE_LABEL: Record<Profile, string> = { novel: "story (novel profile)", news: "news (news profile)", script: "read-aloud script (script profile)" };

/** Fewer problems wins; on a tie, the attempt that kept more valid spans. */
function isBetter(a: ValidationResult, b: ValidationResult): boolean {
  return a.errors.length < b.errors.length || (a.errors.length === b.errors.length && a.spans.length > b.spans.length);
}

function majority(values: string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

/** Meta Model API is OpenAI-compatible: the OpenAI SDK pointed at Meta's base URL. */
function metaComplete(config: EngineConfig & { model: string; effort: ReasoningEffort }): CompleteFn {
  let client: OpenAI | undefined;
  return async (messages, signal) => {
    client ??= new OpenAI({
      apiKey: config.apiKey ?? process.env.META_API_KEY,
      baseURL: config.baseURL ?? process.env.META_BASE_URL ?? "https://api.meta.ai/v1",
      timeout: config.timeoutMs ?? 90_000,
      maxRetries: 1,
    });
    const res = await client.chat.completions.create(
      {
        model: config.model,
        messages,
        response_format: { type: "json_object" },
        reasoning_effort: config.effort,
        max_completion_tokens: 8000,
      } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
      { signal },
    );
    return res.choices[0]?.message?.content ?? "";
  };
}
