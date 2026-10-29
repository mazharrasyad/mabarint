import { timingSafeEqual } from "node:crypto";

// Runs as one long-lived Node process on the VPS, so in-memory counters are enough.

const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) ? Number(v) : d);

export const LIMITS = {
  enabled: process.env.PLAYGROUND_ENABLED !== "false",
  accessCode: process.env.PLAYGROUND_ACCESS_CODE ?? "",
  maxChars: num(process.env.MAX_INPUT_CHARS, 1000),
  perIp: num(process.env.RATE_LIMIT_PER_IP, 10),
  windowMs: num(process.env.RATE_LIMIT_WINDOW_MIN, 10) * 60_000,
  daily: num(process.env.DAILY_LIMIT, 300),
};

export function checkAccessCode(code: unknown): boolean {
  if (!LIMITS.accessCode) return true;
  if (typeof code !== "string") return false;
  const a = Buffer.from(code.trim());
  const b = Buffer.from(LIMITS.accessCode);
  return a.length === b.length && timingSafeEqual(a, b);
}

const hits = new Map<string, number[]>();
let day = "";
let dayCount = 0;

/** Counts one live model request. Returns seconds to wait when a limit is hit. */
export function takeQuota(ip: string): { ok: true } | { ok: false; scope: "ip" | "daily"; retryAfter: number } {
  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    dayCount = 0;
  }
  if (dayCount >= LIMITS.daily) {
    const tomorrow = Date.parse(today) + 86_400_000;
    return { ok: false, scope: "daily", retryAfter: Math.ceil((tomorrow - now) / 1000) };
  }
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < LIMITS.windowMs);
  if (recent.length >= LIMITS.perIp) {
    return { ok: false, scope: "ip", retryAfter: Math.ceil((recent[0] + LIMITS.windowMs - now) / 1000) };
  }
  recent.push(now);
  hits.set(ip, recent);
  dayCount++;
  if (hits.size > 5000) hits.clear();
  return { ok: true };
}

export function clientIp(headers: Headers): string {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}
