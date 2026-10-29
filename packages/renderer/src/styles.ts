import type { Emotion } from "@mabarint/types";

/** "off" shows the plain text, "full" shows Mabarint notation. */
export type Intensity = "off" | "full";

/** Underline colours per emotion. Sarcasm is dashed so it never relies on colour alone. */
export const EMOTION_COLORS: Record<Exclude<Emotion, "neutral">, { light: string; dark: string }> = {
  joy: { light: "#d97706", dark: "#fbbf24" },
  sadness: { light: "#2563eb", dark: "#60a5fa" },
  anger: { light: "#dc2626", dark: "#f87171" },
  fear: { light: "#7c3aed", dark: "#a78bfa" },
  surprise: { light: "#0d9488", dark: "#2dd4bf" },
  tenderness: { light: "#db2777", dark: "#f472b6" },
  sarcasm: { light: "#6b7280", dark: "#9ca3af" },
};

const on = (modes: Intensity[]) => `.mbr:is(${modes.map((m) => `[data-mbr-intensity="${m}"]`).join(",")})`;
const FULL = on(["full"]);

const emotionVars = (mode: "light" | "dark") =>
  Object.entries(EMOTION_COLORS).map(([e, c]) => `--mbr-${e}: ${c[mode]};`).join(" ");

export const CSS = `
.mbr { white-space: pre-wrap; --mbr-muted: #8a8478; --mbr-tip-bg: #1c1a17; --mbr-tip-fg: #f5f3ee; ${emotionVars("light")} }
@media (prefers-color-scheme: dark) {
  .mbr { --mbr-muted: #8f897d; --mbr-tip-bg: #f5f3ee; --mbr-tip-fg: #1c1a17; ${emotionVars("dark")} }
}
:is(.dark, [data-theme="dark"]) .mbr { --mbr-muted: #8f897d; --mbr-tip-bg: #f5f3ee; --mbr-tip-fg: #1c1a17; ${emotionVars("dark")} }

.mbr-piece { transition: none; }
.mbr-pause, .mbr-pitch {
  display: none; color: var(--mbr-muted); font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  font-weight: 700; font-style: normal; letter-spacing: 0; word-spacing: 0; text-decoration: none; user-select: none;
}

/* Mabarint mode: every dimension */
${FULL} .mbr-stress-1 { font-weight: 560; }
${FULL} .mbr-stress-2 { font-weight: 680; }
${FULL} .mbr-stress-3 { font-weight: 800; }
${FULL} .mbr-pause { display: inline; }
.mbr-pause-short { margin: 0 0.14em; font-size: 1.15em; }
.mbr-pause-long { margin: 0 0.3em; }

${FULL} .mbr-elong-1 { letter-spacing: 0.08em; }
${FULL} .mbr-elong-2 { letter-spacing: 0.15em; }
${FULL} .mbr-elong-3 { letter-spacing: 0.25em; }
${FULL} .mbr-tail-rise { position: relative; top: -0.15em; }
${FULL} .mbr-tail-fall { position: relative; top: 0.15em; }
${FULL} .mbr-pitch { display: inline; font-size: 0.82em; margin-left: 0.1em; vertical-align: 0.3em; }
${FULL} .mbr-tempo-slow { word-spacing: 0.25em; }
${FULL} .mbr-tempo-fast { word-spacing: -0.05em; }
${FULL} .mbr-vol-whisper { opacity: 0.55; }
${FULL} .mbr-vol-soft { opacity: 0.75; }
${FULL} .mbr-vol-loud { font-size: 1.08em; }
${FULL} .mbr-vol-shout { font-size: 1.15em; font-weight: 700; }
${FULL} .mbr-emo {
  text-decoration-line: underline; text-decoration-thickness: 2px;
  text-underline-offset: 0.22em; text-decoration-skip-ink: none;
}
${FULL} .mbr-emo-strong { text-decoration-thickness: 3px; }
${Object.keys(EMOTION_COLORS).map((e) => `${FULL} .mbr-emo-${e} { text-decoration-color: var(--mbr-${e}); }`).join("\n")}
${FULL} .mbr-emo-sarcasm { text-decoration-style: dashed; }

.mbr [data-mbr-tip] { cursor: help; border-radius: 2px; }
.mbr[data-mbr-intensity="off"] [data-mbr-tip] { cursor: inherit; }
.mbr [data-mbr-tip]:focus-visible { outline: 2px solid var(--mbr-muted); outline-offset: 2px; }

.mbr-tooltip {
  position: fixed; z-index: 2147483000; max-width: min(320px, calc(100vw - 24px));
  padding: 8px 10px; border-radius: 8px; pointer-events: none;
  background: var(--mbr-tip-bg, #1c1a17); color: var(--mbr-tip-fg, #f5f3ee);
  font: 13px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; font-weight: 400;
  letter-spacing: 0; word-spacing: 0; text-decoration: none; white-space: normal;
  box-shadow: 0 6px 24px rgba(0,0,0,0.18);
}
.mbr-tooltip[hidden] { display: none; }
.mbr-tooltip div + div { margin-top: 4px; }
`;

const STYLE_ID = "mabarint-styles";

/** Adds the renderer stylesheet once per document. */
export function injectStyles(doc: Document = document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.appendChild(style);
}
