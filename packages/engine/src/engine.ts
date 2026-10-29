import OpenAI from "openai";
import {
  PROFILES, SCHEMA_VERSION,
  type Annotation, type AnnotationResult, type Profile, type Refusal, type Span,
} from "@mabarint/types";
import { AnnotationCache, cacheKey } from "./cache";
import { SYSTEM_PROMPT, repairPrompt, userPrompt } from "./prompt";
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

export type ProgressStage = "cache" | "segment" | "model" | "validate" | "repair" | "merge" | "done";
export interface ProgressEvent {
  stage: ProgressStage;
  message: string;
  paragraph?: number;
  paragraphs?: number;
}

export interface AnnotateRequest {
  text: string;
  profile?: Profile;
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
    seg: Segment, index: number, total: number, req: Required<Pick<AnnotateRequest, "profile" | "lang">> & AnnotateRequest,
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

  async function annotate(input: AnnotateRequest): Promise<AnnotationResult> {
    const started = Date.now();
    const req = { ...input, profile: input.profile ?? "novel", lang: input.lang ?? "en", context: input.context ?? "" };
    if (!PROFILES.includes(req.profile)) throw new Error(`Unknown profile "${req.profile}"`);
    const text = req.text;

    const key = cacheKey({ text, profile: req.profile, lang: req.lang, context: req.context, v: SCHEMA_VERSION, model, effort, prompt: SYSTEM_PROMPT });
    const cached = await cache.get(key);
    if (cached) {
      req.onProgress?.({ stage: "cache", message: "Loaded from cache" });
      req.onProgress?.({ stage: "done", message: "Done" });
      return { ...cached, meta: { ...cached.meta, cached: true } };
    }

    const segs = paragraphs(text);
    req.onProgress?.({ stage: "segment", message: `Split into ${segs.length} paragraph${segs.length === 1 ? "" : "s"}`, paragraphs: segs.length });

    const stats = { calls: 0, repairs: 0, issues: [] as string[] };
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

    const meta = { model, calls: stats.calls, repairs: stats.repairs, ms: Date.now() - started };
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
