"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Annotated, IntensityProvider, IntensityToggle } from "@/components/reader";
import { DEMOS } from "@/lib/demo";

const SEEN_KEY = "mabarint.guideSeen.v1";

// First paragraph of the home demo, as annotated by Muse Spark.
const SAMPLE_TEXT = DEMOS.home.text.slice(0, DEMOS.home.text.indexOf("\n\n"));
const SAMPLE_SPANS = ("spans" in DEMOS.home.annotation ? DEMOS.home.annotation.spans : []).filter((s) => s.end <= SAMPLE_TEXT.length);

const MARKS = [
  { sample: <b style={{ fontWeight: 800 }}>fine</b>, label: "Heavier word", text: "Stress: the narrator leans on it." },
  { sample: <span style={{ color: "var(--muted)", fontWeight: 700 }}>‧ ‖</span>, label: "Dots and bars", text: "A short or long pause." },
  { sample: <span style={{ textDecoration: "underline 3px #2563eb", textUnderlineOffset: 4 }}>sad</span>, label: "Coloured underline", text: "Emotion. Sarcasm is dashed." },
  { sample: <span style={{ color: "var(--muted)", fontWeight: 700 }}>↗ ↘</span>, label: "Arrows", text: "The voice rises or falls." },
  { sample: <span style={{ letterSpacing: "0.2em" }}>so</span>, label: "Wide letters", text: "The word is drawn out." },
  { sample: <span style={{ opacity: 0.55 }}>hush</span>, label: "Faded text", text: "Whispered or soft." },
];

const PAGES = [
  { href: "/meanings", title: "One sentence", text: "Start here: one sentence, six meanings." },
  { href: "/novel", title: "Novel", text: "Classic scenes with full notation." },
  { href: "/news", title: "News", text: "Quotes carry emotion, the reporter stays neutral." },
  { href: "/playground", title: "Playground", text: "Annotate your own text live with Muse Spark." },
];

/** First-visit tutorial. Opens once per browser; the Guide button reopens it. */
export function Guide() {
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);

  const open = () => {
    setStep(0);
    if (!ref.current?.open) ref.current?.showModal();
  };
  const close = () => {
    ref.current?.close();
    try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* storage blocked: the guide just shows again */ }
  };

  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === "1"; } catch { /* storage blocked */ }
    if (!seen) open();
  }, []);

  const steps = [
    {
      title: "Welcome to Mabarint",
      body: (
        <>
          <p>
            Authors write plain text. <strong>Meta Muse Spark</strong> reads the context and adds small reading marks,
            like tajwid in Qur&apos;anic text, so you can <em>hear</em> how a line should sound.
          </p>
          <div className="guide-sample">
            <div className="label">Plain text</div>
            <div className="reading" style={{ whiteSpace: "pre-wrap" }}>{SAMPLE_TEXT}</div>
            <div className="label" style={{ marginTop: 14 }}>With Mabarint</div>
            <Annotated text={SAMPLE_TEXT} spans={SAMPLE_SPANS} intensity="full" />
          </div>
        </>
      ),
    },
    {
      title: "How to read the marks",
      body: (
        <>
          <p>The words never change. Muse Spark only adds these marks:</p>
          <ul className="guide-marks">
            {MARKS.map((m) => (
              <li key={m.label}>
                <span className="guide-mark-sample reading">{m.sample}</span>
                <span><strong>{m.label}</strong> <span className="muted">{m.text}</span></span>
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      title: "Choose how much to see",
      body: (
        <IntensityProvider>
          <p>
            Use the <strong>Off / Subtle / Full</strong> switch on every page. Subtle shows only stress and pauses.
            Try it here, then <strong>hover or tap a marked word</strong> to read why Muse Spark marked it.
          </p>
          <div className="guide-sample">
            <div style={{ marginBottom: 12 }}><IntensityToggle /></div>
            <Annotated text={SAMPLE_TEXT} spans={SAMPLE_SPANS} />
          </div>
        </IntensityProvider>
      ),
    },
    {
      title: "Where to go next",
      body: (
        <>
          <ul className="guide-pages">
            {PAGES.map((p) => (
              <li key={p.href}>
                <Link href={p.href} onClick={close}><strong>{p.title}</strong></Link>
                <span className="muted"> {p.text}</span>
              </li>
            ))}
          </ul>
          <p className="small muted">You can reopen this guide any time from the <strong>Guide</strong> button at the top.</p>
        </>
      ),
    },
  ];
  const last = step === steps.length - 1;

  return (
    <>
      <button type="button" className="guide-open" onClick={open} aria-haspopup="dialog">Guide</button>
      <dialog ref={ref} className="guide" aria-labelledby="guide-title" onCancel={close}>
        <div className="guide-head">
          <span className="small muted">Step {step + 1} of {steps.length}</span>
          <button type="button" className="guide-close" aria-label="Close guide" onClick={close}>×</button>
        </div>
        <h2 id="guide-title">{steps[step].title}</h2>
        <div className="guide-body">{steps[step].body}</div>
        <div className="guide-foot">
          <div className="guide-dots" aria-hidden="true">
            {steps.map((_, i) => <span key={i} className={i === step ? "on" : ""} />)}
          </div>
          <div className="guide-actions">
            {step > 0 ? (
              <button type="button" className="btn ghost" onClick={() => setStep(step - 1)}>Back</button>
            ) : (
              <button type="button" className="btn ghost" onClick={close}>Skip</button>
            )}
            {last ? (
              <Link href="/meanings" className="btn" onClick={close}>Start with One sentence</Link>
            ) : (
              <button type="button" className="btn" onClick={() => setStep(step + 1)} autoFocus>Next</button>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
