"use client";

import { useEffect, useRef, useState } from "react";
import type { AnnotationResult, Profile } from "@mabarint/types";

const TYPE_LABEL: Record<Profile, string> = { novel: "Story", news: "News", script: "Speech or script" };

/** Turns the engine's technical progress events into plain-language steps (null = not shown). */
function friendlyStep(stage: string, message: string): string | null {
  switch (stage) {
    case "send": return "Sending your text";
    case "cache": return "Found it among recent readings";
    case "detect": {
      const m = /Detected: (story|news|read-aloud script)/.exec(message);
      if (!m) return "Figuring out what kind of text this is";
      return m[1] === "story" ? "Looks like a story" : m[1] === "news" ? "Looks like a news article" : "Looks like a speech or script";
    }
    case "model": return "Reading it like a narrator";
    case "validate": return "Double-checking every mark";
    case "repair": return "Fixing a few marks";
    case "done": return "Done";
    default: return null;
  }
}
import { Annotated, IntensityProvider, IntensityToggle, Legend } from "@/components/reader";
import { useToast } from "@/components/toast";
import type { Demo } from "@/lib/demo";

const API = "/mabarint/api/annotate";
const HISTORY_API = "/mabarint/api/history";
const CODE_KEY = "mabarint.accessCode";
const CLIENT_KEY = "mabarint.clientId";

interface Config { enabled: boolean; requiresCode: boolean; maxChars: number; model: string }
interface Step { stage: string; message: string; state: "active" | "done" }
type Result = AnnotationResult & { text?: string };
interface HistoryItem {
  id: string;
  time: string;
  text: string;
  status: "ok" | "refused" | "error";
  error?: string;
  profile?: Profile;
  marks?: number;
  ms?: number;
  result?: Result;
  mine?: boolean;
}

/** A random id kept in this browser, so the history can mark this visitor's own runs. */
function browserId(): string {
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

export function Playground({ presets }: { presets: Demo[] }) {
  const toast = useToast();
  const [config, setConfig] = useState<Config | null>(null);
  const [text, setText] = useState(presets[0].text);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<Result | null>(presets[0].annotation);
  const [source, setSource] = useState<"precomputed" | "live">("precomputed");
  const startedAt = useRef(0);
  const [clientId, setClientId] = useState("anonymous");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);

  useEffect(() => {
    fetch(API).then((r) => r.json()).then(setConfig).catch(() => setConfig({ enabled: false, requiresCode: false, maxChars: 1000, model: "" }));
    try { setCode(sessionStorage.getItem(CODE_KEY) ?? ""); } catch { /* storage blocked */ }
    const id = browserId();
    setClientId(id);
    loadHistory(id);
  }, []);

  function loadHistory(id = clientId) {
    fetch(`${HISTORY_API}?client=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d) => {
        setHistory(d.entries ?? []);
        setHistoryTotal(d.total ?? 0);
      })
      .catch(() => { /* history is a convenience; the playground still works */ });
  }

  function openHistory(h: HistoryItem) {
    setText(h.text);
    if (h.result) {
      setResult({ ...h.result, text: h.result.text ?? h.text });
      setSource("live");
    }
    setSteps([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const maxChars = config?.maxChars ?? 1000;
  const tooLong = text.length > maxChars;

  function loadPreset(d: Demo) {
    setText(d.text);
    setResult(d.annotation);
    setSource("precomputed");
    setSteps([]);
  }

  function progress(stage: string, message: string) {
    const label = friendlyStep(stage, message);
    if (!label) return;
    setSteps((all) => {
      if (all.some((s) => s.message === label)) return all;
      const done = all.map((s) => ({ ...s, state: "done" as const }));
      return [...done, { stage, message: label, state: "active" }];
    });
  }

  async function annotate() {
    if (busy) return;
    if (!text.trim()) return toast({ kind: "error", title: "Nothing to read yet", body: "Paste or type some text first." });
    if (tooLong) return toast({ kind: "error", title: "Text is too long", body: `Please keep it under ${maxChars} characters.` });
    if (config?.requiresCode && !code.trim()) return toast({ kind: "error", title: "Access code needed", body: "This server requires an access code for live runs." });

    setBusy(true);
    setSteps([]);
    startedAt.current = performance.now();
    progress("send", "");
    try { sessionStorage.setItem(CODE_KEY, code.trim()); } catch { /* storage blocked */ }

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ text, profile: "auto", code: code.trim(), clientId }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
        throw Object.assign(new Error(err.error), { code: err.code });
      }
      const final = await readEvents(res.body, (e) => progress(e.stage, e.message));
      finish(final);
    } catch (e) {
      const err = e as Error & { code?: string };
      setSteps((all) => all.map((s) => ({ ...s, state: "done" })));
      toast({ kind: "error", title: errorTitle(err.code), body: friendlyError(err.code, err.message) });
    } finally {
      setBusy(false);
      loadHistory();
    }
  }

  function finish(final: Result) {
    const secs = ((performance.now() - startedAt.current) / 1000).toFixed(1);
    setSteps((all) => all.map((s) => ({ ...s, state: "done" })));
    setResult({ ...final, text: final.text ?? text });
    setSource("live");
    if ("refused" in final && final.refused) {
      toast({ kind: "error", title: "We can't mark this one", body: "Mabarint doesn't add marks to political or war news." });
    } else if ("spans" in final) {
      const type = final.meta?.detectedProfile ?? final.profile;
      toast({
        kind: "success",
        title: "Reading marks added",
        body: `Looks like ${type === "news" ? "a news article" : type === "script" ? "a speech or script" : "a story"}. ${final.spans.length} marks in ${secs} seconds.`,
      });
    }
  }

  return (
    <IntensityProvider>
      <div className="card" style={{ display: "grid", gap: 14 }}>
        <div className="field">
          <span className="label" style={{ margin: 0 }}>Try an example</span>
          <div className="row" style={{ gap: 8 }}>
            {presets.map((d) => (
              <button key={d.id} type="button" className="btn ghost" style={{ minHeight: 36, padding: "6px 12px", fontSize: 14 }} onClick={() => loadPreset(d)} disabled={busy}>
                {d.title}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="pg-text">Or paste your own text</label>
          <textarea id="pg-text" value={text} onChange={(e) => setText(e.target.value)} disabled={busy} aria-describedby="pg-count" placeholder="Paste a paragraph from a story, a news article or a speech…" />
          <span id="pg-count" className="small" style={{ color: tooLong ? "var(--err)" : "var(--muted)" }}>
            {text.length} / {maxChars} characters · No settings needed: Mabarint works out whether it&apos;s a story, news or a speech
          </span>
        </div>

        <div className="row">
          {config?.requiresCode && (
            <div className="field">
              <label htmlFor="pg-code">Access code</label>
              <input id="pg-code" type="password" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} disabled={busy} placeholder="Access code" />
            </div>
          )}
          <button type="button" className="btn" onClick={annotate} disabled={busy || config?.enabled === false} aria-busy={busy}>
            {busy ? <><span className="spinner" aria-hidden="true" /> Reading your text…</> : "Add reading marks"}
          </button>
        </div>

        {config?.enabled === false && (
          <p className="notice refused">The Playground is resting right now. The examples above still work.</p>
        )}

        {steps.length > 0 && (
          <ol className="progress" aria-live="polite" aria-label="Progress">
            {steps.map((s, i) => <li key={i} className={s.state}>{s.message}</li>)}
          </ol>
        )}
      </div>

      {result && (
        <section className="section" style={{ marginTop: 28 }}>
          <div className="toolbar" style={{ top: 61 }}>
            <IntensityToggle />
            {source === "precomputed" && <span className="pill">Example</span>}
            {result.profile && (
              <span className="small">
                Looks like: <strong>{TYPE_LABEL[result.meta?.detectedProfile ?? result.profile]}</strong>
              </span>
            )}
          </div>
          <div className="card">
            {"refused" in result && result.refused ? (
              <p className="notice refused"><strong>We can&apos;t mark this one.</strong> Mabarint doesn&apos;t add marks to political or war news.</p>
            ) : (
              <Annotated text={result.text ?? text} spans={"spans" in result ? result.spans : []} />
            )}
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>Hover or tap a marked word to see why it was marked.</p>
          <div className="card" style={{ marginTop: 16 }}><Legend /></div>
        </section>
      )}

      <section className="section" style={{ marginTop: 28 }} aria-labelledby="history-title">
        <h2 id="history-title">Recent readings</h2>
        <p className="small muted">
          Everything people paste here is saved with the time and shown below for everyone
          {historyTotal > history.length ? ` (latest ${history.length} of ${historyTotal})` : ""}, so please don&apos;t
          paste anything private. Tap one to open it.
        </p>
        {history.length === 0 ? (
          <p className="small muted">Nothing yet. Be the first!</p>
        ) : (
          <ul className="history">
            {history.map((h) => (
              <li key={h.id}>
                <button type="button" onClick={() => openHistory(h)} disabled={busy || !h.result} title={h.result ? "Open this run" : undefined}>
                  <span className="history-meta">
                    <time dateTime={h.time}>{new Date(h.time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time>
                    <span className={`history-status ${h.status}`}>
                      {h.status === "ok"
                        ? `${h.profile ? TYPE_LABEL[h.profile] : "Done"} · ${h.marks ?? 0} marks`
                        : h.status === "refused" ? "Not marked (politics or war)" : errorTitle(h.error)}
                    </span>
                    {h.mine && <span className="pill">You</span>}
                  </span>
                  <span className="history-text">{h.text}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </IntensityProvider>
  );
}

function errorTitle(code?: string): string {
  switch (code) {
    case "access_code": return "Wrong access code";
    case "rate_limited": return "Slow down a little";
    case "daily_limit": return "Back tomorrow";
    case "too_long": return "Text is too long";
    case "timeout": return "That took too long";
    case "disabled": return "Playground is resting";
    default: return "Something went wrong";
  }
}

/** Server messages are written for developers; readers get a plain sentence instead where it helps. */
function friendlyError(code: string | undefined, message: string): string {
  switch (code) {
    case "timeout": return "Please try again, or try a shorter text.";
    case "upstream": return "Mabarint couldn't reach Meta's AI just now. Please try again in a moment.";
    case "daily_limit": return "Today's free readings are used up. The examples still work.";
    default: return message;
  }
}

/** Reads a server-sent event stream from a POST response. Resolves with the result event. */
async function readEvents(body: ReadableStream<Uint8Array>, onProgress: (e: { stage: string; message: string }) => void): Promise<Result> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let cut: number;
    while ((cut = buffer.indexOf("\n\n")) >= 0) {
      const chunk = buffer.slice(0, cut);
      buffer = buffer.slice(cut + 2);
      const event = /^event: (.*)$/m.exec(chunk)?.[1];
      const data = JSON.parse(/^data: (.*)$/m.exec(chunk)?.[1] ?? "null");
      if (event === "progress") onProgress(data);
      else if (event === "result") return data;
      else if (event === "error") throw Object.assign(new Error(data.error), { code: data.code });
    }
  }
  throw new Error("The connection closed before a result arrived. Please try again.");
}
