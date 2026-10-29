import type { Contour, Emotion, PauseLength, Span } from "@mabarint/types";

/** A run of text whose covering spans are identical. */
export interface TextPiece {
  kind: "text";
  start: number;
  end: number;
  text: string;
  classes: string[];
  emotion?: Emotion;
  /** Tooltip lines from every span covering this piece. */
  tips: string[];
  /** True when a span with a reason starts here: the piece takes keyboard focus. */
  anchor: boolean;
}
export interface MarkerPiece {
  kind: "pause" | "pitch";
  at: number;
  length?: PauseLength;
  contour?: Contour;
}
export type Piece = TextPiece | MarkerPiece;

const EMOTION_LABEL: Record<Emotion, string> = {
  neutral: "Neutral", joy: "Joy", sadness: "Sadness", anger: "Anger", fear: "Fear",
  surprise: "Surprise", tenderness: "Tenderness", sarcasm: "Sarcasm",
};

const WORD = /[\p{L}\p{N}'’-]+/gu;

/** The last word inside a pitch span: where the melody lands. */
function pitchTail(text: string, start: number, end: number): [number, number] {
  let tail: [number, number] = [start, end];
  for (const m of text.slice(start, end).matchAll(WORD)) tail = [start + m.index!, start + m.index! + m[0].length];
  return tail;
}

function tipFor(s: Span): string | null {
  switch (s.type) {
    case "utterance": {
      if (s.emotion === "neutral" && !s.reason) return null;
      const who = s.speaker ? ` · ${s.speaker}` : "";
      return `${EMOTION_LABEL[s.emotion]}${who}${s.reason ? ` — ${s.reason}` : ""}`;
    }
    case "stress": return `Stress ${"●".repeat(s.level)}${s.reason ? ` — ${s.reason}` : ""}`;
    case "elongate": return `Drawn out${s.reason ? ` — ${s.reason}` : ""}`;
    case "volume": return s.level === "normal" ? null : `Volume: ${s.level}${s.reason ? ` — ${s.reason}` : ""}`;
    case "tempo": return s.rate === "normal" ? null : `Tempo: ${s.rate}${s.reason ? ` — ${s.reason}` : ""}`;
    case "pitch": return s.reason ? `Pitch ${s.contour} — ${s.reason}` : null;
    default: return null;
  }
}

/**
 * Flattens possibly overlapping spans into a linear list of text runs and
 * point markers. Every run carries the classes of all spans covering it, so
 * overlaps never need nested or crossing elements.
 */
export function layout(text: string, spans: Span[]): Piece[] {
  const len = text.length;
  const ranged = spans.filter((s) => s.type !== "pause" && s.start < s.end && s.start >= 0 && s.end <= len);
  const pauses = spans.filter((s) => s.type === "pause" && s.start >= 0 && s.start <= len);
  const tails = ranged.filter((s) => s.type === "pitch").map((s) => {
    const [a, b] = pitchTail(text, s.start, s.end);
    return { start: a, end: b, contour: (s as Extract<Span, { type: "pitch" }>).contour, pitchEnd: s.end };
  });

  const cuts = new Set<number>([0, len]);
  for (const s of ranged) cuts.add(s.start).add(s.end);
  for (const t of tails) cuts.add(t.start).add(t.end);
  for (const p of pauses) cuts.add(p.start);
  const points = [...cuts].sort((a, b) => a - b);

  const out: Piece[] = [];
  const markersAt = (pos: number) => {
    for (const t of tails) if (t.pitchEnd === pos) out.push({ kind: "pitch", at: pos, contour: t.contour });
    for (const p of pauses) if (p.start === pos) out.push({ kind: "pause", at: pos, length: (p as Extract<Span, { type: "pause" }>).length });
  };

  markersAt(0);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const covering = ranged.filter((s) => s.start <= a && s.end >= b);
    const classes: string[] = [];
    const tips: string[] = [];
    let emotion: Emotion | undefined;
    let anchor = false;
    for (const s of covering) {
      switch (s.type) {
        case "utterance":
          if (s.emotion !== "neutral") { classes.push("mbr-emo", `mbr-emo-${s.emotion}`); emotion = s.emotion; }
          if ((s.intensity ?? 0) >= 0.75) classes.push("mbr-emo-strong");
          break;
        case "stress": classes.push(`mbr-stress-${s.level}`); break;
        case "elongate": classes.push(`mbr-elong-${s.level}`); break;
        case "tempo": if (s.rate !== "normal") classes.push(`mbr-tempo-${s.rate}`); break;
        case "volume": if (s.level !== "normal") classes.push(`mbr-vol-${s.level}`); break;
        case "pitch": break;
      }
      const tip = tipFor(s);
      if (tip) {
        tips.push(tip);
        if (s.start === a) anchor = true;
      }
    }
    for (const t of tails) if (t.start <= a && t.end >= b) classes.push(`mbr-tail-${t.contour}`);
    out.push({ kind: "text", start: a, end: b, text: text.slice(a, b), classes, emotion, tips, anchor });
    markersAt(b);
  }
  return out;
}
