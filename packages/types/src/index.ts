// Mabarint v0.1 annotation format. Mirrors schema/mabarint.schema.json; keep both in sync.

export const SCHEMA_VERSION = "0.1" as const;

export const PROFILES = ["novel", "news", "script"] as const;
export type Profile = (typeof PROFILES)[number];

export const EMOTIONS = ["neutral", "joy", "sadness", "anger", "fear", "surprise", "tenderness", "sarcasm"] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const SPAN_TYPES = ["utterance", "stress", "elongate", "pause", "pitch", "tempo", "volume"] as const;
export type SpanType = (typeof SPAN_TYPES)[number];

export const LEVELS = [1, 2, 3] as const;
export type Level = (typeof LEVELS)[number];
export const PAUSE_LENGTHS = ["short", "long"] as const;
export type PauseLength = (typeof PAUSE_LENGTHS)[number];
export const CONTOURS = ["rise", "fall", "rise-fall"] as const;
export type Contour = (typeof CONTOURS)[number];
export const RATES = ["slow", "normal", "fast"] as const;
export type Rate = (typeof RATES)[number];
export const VOLUMES = ["whisper", "soft", "normal", "loud", "shout"] as const;
export type Volume = (typeof VOLUMES)[number];

interface RangeBase {
  /** UTF-16 offset into the passage, inclusive. */
  start: number;
  /** UTF-16 offset into the passage, exclusive. */
  end: number;
  /** Exact substring text.slice(start, end). */
  quote: string;
  /** At most 15 words, shown in the reader tooltip. */
  reason?: string;
}

export interface UtteranceSpan extends RangeBase {
  type: "utterance";
  speaker?: string;
  emotion: Emotion;
  intensity?: number;
}
export interface StressSpan extends RangeBase {
  type: "stress";
  level: Level;
}
export interface ElongateSpan extends RangeBase {
  type: "elongate";
  level: Level;
}
export interface PauseSpan {
  type: "pause";
  start: number;
  /** Always equal to start: a pause is a point between characters. */
  end: number;
  quote?: "";
  length: PauseLength;
  reason?: string;
}
export interface PitchSpan extends RangeBase {
  type: "pitch";
  contour: Contour;
}
export interface TempoSpan extends RangeBase {
  type: "tempo";
  rate: Rate;
}
export interface VolumeSpan extends RangeBase {
  type: "volume";
  level: Volume;
}

export type Span = UtteranceSpan | StressSpan | ElongateSpan | PauseSpan | PitchSpan | TempoSpan | VolumeSpan;

export interface AnnotationMeta {
  model?: string;
  /** Model calls made, including repairs. */
  calls?: number;
  /** Repair rounds that were needed. */
  repairs?: number;
  /** Spans removed because they were still invalid after repair. */
  dropped?: number;
  /** Validation messages that were fixed or led to a drop. */
  issues?: string[];
  ms?: number;
  cached?: boolean;
}

export interface Annotation {
  version: typeof SCHEMA_VERSION;
  profile: Profile;
  lang: string;
  text?: string;
  tone?: string;
  spans: Span[];
  meta?: AnnotationMeta;
}

export interface Refusal {
  version?: typeof SCHEMA_VERSION;
  profile?: Profile;
  refused: true;
  reason: string;
  meta?: AnnotationMeta;
}

export type AnnotationResult = Annotation | Refusal;

export function isRefusal(r: AnnotationResult): r is Refusal {
  return (r as Refusal).refused === true;
}
