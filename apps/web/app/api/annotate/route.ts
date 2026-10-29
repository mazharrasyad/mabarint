import { createEngine, PROFILES, type ProgressEvent, type Profile } from "@mabarint/engine";
import { LIMITS, checkAccessCode, clientIp, takeQuota } from "@/lib/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const engine = createEngine({
  cacheDir: process.env.CACHE_DIR ?? ".cache/annotations",
  effort: (process.env.META_REASONING_EFFORT as "low" | "medium" | "high") ?? "low",
});

const TIMEOUT_MS = 90_000;

type ErrorCode = "disabled" | "bad_request" | "too_long" | "access_code" | "rate_limited" | "daily_limit" | "timeout" | "upstream";

function fail(status: number, code: ErrorCode, error: string, extra: Record<string, unknown> = {}) {
  return Response.json({ code, error, ...extra }, { status });
}

/** Tells the playground what is allowed before the user clicks. */
export function GET() {
  return Response.json({
    enabled: LIMITS.enabled && Boolean(process.env.META_API_KEY),
    requiresCode: Boolean(LIMITS.accessCode),
    maxChars: LIMITS.maxChars,
    profiles: PROFILES,
    model: engine.model,
  });
}

export async function POST(req: Request) {
  if (!LIMITS.enabled || !process.env.META_API_KEY) {
    return fail(503, "disabled", "The live playground is switched off right now. The demo pages still work.");
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const profile = (body?.profile ?? "novel") as Profile;
  const context = typeof body?.context === "string" ? body.context.slice(0, LIMITS.maxChars) : "";
  if (!text) return fail(400, "bad_request", "Paste some text to annotate.");
  if (!PROFILES.includes(profile)) return fail(400, "bad_request", `Profile must be one of ${PROFILES.join(", ")}.`);
  if (text.length > LIMITS.maxChars) return fail(413, "too_long", `Text is ${text.length} characters; the limit is ${LIMITS.maxChars}.`);
  if (!checkAccessCode(body?.code)) return fail(401, "access_code", "That access code is not right. Judges can find it in the submission form.");

  const quota = takeQuota(clientIp(req.headers));
  if (!quota.ok) {
    const minutes = Math.max(1, Math.ceil(quota.retryAfter / 60));
    return fail(429, quota.scope === "daily" ? "daily_limit" : "rate_limited",
      quota.scope === "daily"
        ? "Today's live annotation budget is used up. The demo pages still work."
        : `Too many requests. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      { retryAfter: quota.retryAfter });
  }

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
  req.signal.addEventListener("abort", () => abort.abort());
  const run = (onProgress?: (e: ProgressEvent) => void) =>
    engine.annotate({ text, profile, context, onProgress, signal: abort.signal }).finally(() => clearTimeout(timer));
  const describe = (e: unknown): [ErrorCode, string] =>
    abort.signal.aborted
      ? ["timeout", "Muse Spark took too long to answer. Please try again, or try a shorter text."]
      : ["upstream", `The Meta Model API returned an error: ${(e as Error).message?.slice(0, 160) ?? "unknown"}`];

  // Plain JSON for script-tag integrations; server-sent events for the playground's live progress.
  if (!req.headers.get("accept")?.includes("text/event-stream")) {
    try {
      return Response.json(await run());
    } catch (e) {
      const [code, message] = describe(e);
      return fail(code === "timeout" ? 504 : 502, code, message);
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      try {
        const result = await run((e) => send("progress", e));
        send("result", result);
      } catch (e) {
        const [code, message] = describe(e);
        send("error", { code, error: message });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
