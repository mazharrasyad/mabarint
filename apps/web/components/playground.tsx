"use client";

import { useEffect, useRef, useState } from "react";
import type { AnnotationResult, Profile } from "@mabarint/types";
import { Annotated, IntensityProvider, IntensityToggle, Legend } from "@/components/reader";
import { useToast } from "@/components/toast";
import type { Demo } from "@/lib/demo";

const API = "/mabarint/api/annotate";
const CODE_KEY = "mabarint.accessCode";

interface Config { enabled: boolean; requiresCode: boolean; maxChars: number; model: string }
interface Step { stage: string; message: string; state: "active" | "done" }
type Result = AnnotationResult & { text?: string };

export function Playground({ presets }: { presets: Demo[] }) {
  const toast = useToast();
  const [config, setConfig] = useState<Config | null>(null);
  const [text, setText] = useState(presets[0].text);
  const [profile, setProfile] = useState<Profile>(presets[0].profile);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<Result | null>(presets[0].annotation);
  const [source, setSource] = useState<"precomputed" | "live">("precomputed");
  const [tab, setTab] = useState<"rendered" | "json">("rendered");
  const startedAt = useRef(0);

  useEffect(() => {
    fetch(API).then((r) => r.json()).then(setConfig).catch(() => setConfig({ enabled: false, requiresCode: true, maxChars: 1000, model: "" }));
    try { setCode(sessionStorage.getItem(CODE_KEY) ?? ""); } catch { /* storage blocked */ }
  }, []);

  const maxChars = config?.maxChars ?? 1000;
  const tooLong = text.length > maxChars;

  function loadPreset(d: Demo) {
    setText(d.text);
    setProfile(d.profile);
    setResult(d.annotation);
    setSource("precomputed");
    setSteps([]);
  }

  function progress(stage: string, message: string) {
    setSteps((all) => {
      const done = all.map((s) => ({ ...s, state: "done" as const }));
      return [...done, { stage, message, state: "active" }];
    });
  }

  async function annotate() {
    if (busy) return;
    if (!text.trim()) return toast({ kind: "error", title: "Nothing to annotate", body: "Paste some text first." });
    if (tooLong) return toast({ kind: "error", title: "Text is too long", body: `Keep it under ${maxChars} characters.` });
    if (config?.requiresCode && !code.trim()) return toast({ kind: "error", title: "Access code needed", body: "Live runs are for the hackathon judges. The code is in the submission form." });

    setBusy(true);
    setSteps([]);
    startedAt.current = performance.now();
    progress("send", "Sending text to the Mabarint engine");
    try { sessionStorage.setItem(CODE_KEY, code.trim()); } catch { /* storage blocked */ }

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ text, profile, code: code.trim() }),
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
      toast({ kind: "error", title: errorTitle(err.code), body: err.message });
    } finally {
      setBusy(false);
    }
  }

  function finish(final: Result) {
    const secs = ((performance.now() - startedAt.current) / 1000).toFixed(1);
    setSteps((all) => all.map((s) => ({ ...s, state: "done" })));
    setResult({ ...final, text: final.text ?? text });
    setSource("live");
    setTab("rendered");
    if ("refused" in final && final.refused) {
      toast({ kind: "error", title: "Refused by the news profile", body: final.reason });
    } else if ("spans" in final) {
      const repairs = final.meta?.repairs ?? 0;
      toast({
        kind: "success",
        title: final.meta?.cached ? "Loaded from cache" : `Annotated in ${secs}s`,
        body: `${final.spans.length} marks added${repairs ? `, ${repairs} repair round${repairs > 1 ? "s" : ""}` : ""}.`,
      });
    }
  }

  return (
    <IntensityProvider>
      <div className="card" style={{ display: "grid", gap: 14 }}>
        <div className="field">
          <span className="label" style={{ margin: 0 }}>Examples (precomputed, no API call)</span>
          <div className="row" style={{ gap: 8 }}>
            {presets.map((d) => (
              <button key={d.id} type="button" className="btn ghost" style={{ minHeight: 36, padding: "6px 12px", fontSize: 14 }} onClick={() => loadPreset(d)} disabled={busy}>
                {d.title}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="pg-text">Text</label>
          <textarea id="pg-text" value={text} onChange={(e) => setText(e.target.value)} disabled={busy} aria-describedby="pg-count" />
          <span id="pg-count" className="small" style={{ color: tooLong ? "var(--err)" : "var(--muted)" }}>
            {text.length} / {maxChars} characters
          </span>
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="pg-profile">Profile</label>
            <select id="pg-profile" value={profile} onChange={(e) => setProfile(e.target.value as Profile)} disabled={busy}>
              <option value="novel">Novel: full emotion</option>
              <option value="news">News: neutral narration, refuses politics</option>
              <option value="script">Script: pauses and tempo for reading aloud</option>
            </select>
          </div>
          {config?.requiresCode !== false && (
            <div className="field">
              <label htmlFor="pg-code">Access code</label>
              <input id="pg-code" type="password" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} disabled={busy} placeholder="From the submission form" />
            </div>
          )}
          <button type="button" className="btn" onClick={annotate} disabled={busy || config?.enabled === false} aria-busy={busy}>
            {busy ? <><span className="spinner" aria-hidden="true" /> Annotating…</> : "Annotate with Muse Spark"}
          </button>
        </div>

        {config?.enabled === false && (
          <p className="notice refused">The live playground is switched off right now. The examples above and the demo pages still work.</p>
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
            <span className="pill">{source === "live" ? `Live · ${config?.model ?? "muse-spark"}` : "Precomputed"}</span>
            {result.meta?.ms !== undefined && !result.meta.cached && (
              <span className="small muted">{result.meta.calls} model call{result.meta.calls === 1 ? "" : "s"} · {(result.meta.ms / 1000).toFixed(1)}s engine time</span>
            )}
          </div>
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === "rendered"} onClick={() => setTab("rendered")}>Rendered</button>
            <button role="tab" aria-selected={tab === "json"} onClick={() => setTab("json")}>Mabarint JSON</button>
          </div>
          {tab === "rendered" ? (
            <div className="card">
              {"refused" in result && result.refused ? (
                <p className="notice refused"><strong>Refused.</strong> {result.reason}</p>
              ) : (
                <Annotated text={result.text ?? text} spans={"spans" in result ? result.spans : []} />
              )}
            </div>
          ) : (
            <pre>{JSON.stringify(result, null, 2)}</pre>
          )}
          <div className="card" style={{ marginTop: 16 }}><Legend /></div>
        </section>
      )}
    </IntensityProvider>
  );
}

function errorTitle(code?: string): string {
  switch (code) {
    case "access_code": return "Wrong access code";
    case "rate_limited": return "Slow down a little";
    case "daily_limit": return "Daily limit reached";
    case "too_long": return "Text is too long";
    case "timeout": return "Muse Spark timed out";
    case "disabled": return "Playground is off";
    case "upstream": return "Meta Model API error";
    default: return "Annotation failed";
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
