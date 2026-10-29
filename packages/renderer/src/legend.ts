import type { Annotation, Span } from "@mabarint/types";

export interface LegendItem {
  /** Rendered with the same classes as real annotations, so it always matches. */
  sample: string;
  spans: Span[];
  label: string;
  description: string;
}

const item = (sample: string, label: string, description: string, spans: (len: number) => Span[]): LegendItem =>
  ({ sample, label, description, spans: spans(sample.length) });

export const LEGEND: LegendItem[] = [
  item("never", "Stress", "Heavier weight: the narrator leans on this word (3 levels).",
    (n) => [{ type: "stress", start: 0, end: n, quote: "never", level: 3 }]),
  item("wait the end", "Pause", "‧ short pause, ‖ long pause.",
    () => [{ type: "pause", start: 4, end: 4, length: "short" }, { type: "pause", start: 8, end: 8, length: "long" }]),
  item("so long", "Elongation", "Wider letter spacing: the word is drawn out.",
    () => [{ type: "elongate", start: 0, end: 2, quote: "so", level: 3 }]),
  item("really? fine.", "Pitch", "↗ rises (a question), ↘ falls (finality), ↗↘ rise-fall.",
    () => [{ type: "pitch", start: 0, end: 7, quote: "really?", contour: "rise" }, { type: "pitch", start: 8, end: 13, quote: "fine.", contour: "fall" }]),
  item("slowly, one by one", "Tempo", "Looser word spacing is slower, tighter is faster.",
    (n) => [{ type: "tempo", start: 0, end: n, quote: "slowly, one by one", rate: "slow" }]),
  item("hush / STOP", "Volume", "Faded is whispered or soft, larger is loud or shouted.",
    () => [{ type: "volume", start: 0, end: 4, quote: "hush", level: "whisper" }, { type: "volume", start: 7, end: 11, quote: "STOP", level: "shout" }]),
];

export const EMOTION_LEGEND: Array<{ emotion: Exclude<Annotation["spans"][number] extends infer S ? S extends { emotion: infer E } ? E : never : never, "neutral">; label: string }> = [
  { emotion: "joy", label: "Joy" },
  { emotion: "sadness", label: "Sadness" },
  { emotion: "anger", label: "Anger" },
  { emotion: "fear", label: "Fear" },
  { emotion: "surprise", label: "Surprise" },
  { emotion: "tenderness", label: "Tenderness" },
  { emotion: "sarcasm", label: "Sarcasm (dashed)" },
];
