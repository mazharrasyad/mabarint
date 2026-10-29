export interface Segment {
  text: string;
  /** Offset of this segment in the full input. */
  start: number;
}

/**
 * Splits text into paragraphs on blank lines (or single newlines), keeping the
 * original offsets so spans can be mapped back to the full input.
 */
export function paragraphs(text: string): Segment[] {
  const out: Segment[] = [];
  const re = /[^\n]+(?:\n(?!\s*\n)[^\n]+)*/g;
  for (const m of text.matchAll(re)) {
    const raw = m[0];
    const lead = raw.length - raw.trimStart().length;
    const body = raw.trim();
    if (body) out.push({ text: body, start: m.index! + lead });
  }
  return out;
}

/** Sentence boundaries inside a passage, used for the stress density rule. */
export function sentences(text: string): Segment[] {
  const out: Segment[] = [];
  const re = /[^.!?…]+(?:[.!?…]+["'”’)\]]*|$)/g;
  for (const m of text.matchAll(re)) {
    const raw = m[0];
    const lead = raw.length - raw.trimStart().length;
    const body = raw.trim();
    if (body) out.push({ text: body, start: m.index! + lead });
  }
  return out;
}

export function wordCount(text: string): number {
  return (text.match(/[\p{L}\p{N}'’-]+/gu) ?? []).length;
}

/** Character ranges that sit inside quotation marks (straight or curly). */
export function quotedRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const re = /“[^”]*”?|"[^"]*"?/g;
  for (const m of text.matchAll(re)) ranges.push([m.index!, m.index! + m[0].length]);
  return ranges;
}
