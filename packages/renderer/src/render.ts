import type { Annotation, Span } from "@mabarint/types";
import { layout, type TextPiece } from "./layout";
import { injectStyles, type Intensity } from "./styles";

export interface RenderOptions {
  intensity?: Intensity;
  /** Show the AI's reasons on hover and focus (default true). */
  tooltips?: boolean;
}

const PAUSE_GLYPH = { short: "‧", long: "‖" } as const;
const PITCH_GLYPH = { rise: "↗", fall: "↘", "rise-fall": "↗↘" } as const;
const ORIGINAL = new WeakMap<HTMLElement, string>();

/**
 * Renders `annotation` into `el`. The plain text comes from `annotation.text`
 * or, when absent, from the element itself. The words are never changed:
 * notation is added only through classes and aria-hidden marker glyphs.
 */
export function render(el: HTMLElement, annotation: Pick<Annotation, "spans"> & { text?: string }, options: RenderOptions = {}): void {
  const doc = el.ownerDocument;
  injectStyles(doc);
  const text = annotation.text ?? ORIGINAL.get(el) ?? el.textContent ?? "";
  if (!ORIGINAL.has(el)) ORIGINAL.set(el, text);

  const frag = doc.createDocumentFragment();
  for (const piece of layout(text, annotation.spans as Span[])) {
    if (piece.kind !== "text") {
      const m = doc.createElement("span");
      m.className = piece.kind === "pause" ? `mbr-pause mbr-pause-${piece.length}` : `mbr-pitch mbr-pitch-${piece.contour}`;
      m.textContent = piece.kind === "pause" ? PAUSE_GLYPH[piece.length!] : PITCH_GLYPH[piece.contour!];
      m.setAttribute("aria-hidden", "true");
      frag.appendChild(m);
    } else if (!piece.classes.length && !piece.tips.length) {
      frag.appendChild(doc.createTextNode(piece.text));
    } else {
      frag.appendChild(textSpan(doc, piece, options.tooltips !== false));
    }
  }
  el.replaceChildren(frag);
  el.classList.add("mbr");
  setIntensity(el, options.intensity ?? "full");
  if (options.tooltips !== false) attachTooltips(el);
}

function textSpan(doc: Document, piece: TextPiece, tooltips: boolean): HTMLElement {
  const s = doc.createElement("span");
  s.className = ["mbr-piece", ...piece.classes].join(" ");
  s.textContent = piece.text;
  if (tooltips && piece.tips.length) {
    s.dataset.mbrTip = piece.tips.join("\n");
    if (piece.anchor) s.tabIndex = 0;
  }
  return s;
}

/** Switches between Off (plain text), Subtle (stress + pause) and Full. */
export function setIntensity(el: HTMLElement, intensity: Intensity): void {
  el.dataset.mbrIntensity = intensity;
}

/** Restores the element's original plain text. */
export function unrender(el: HTMLElement): void {
  const text = ORIGINAL.get(el);
  if (text !== undefined) el.textContent = text;
  el.classList.remove("mbr");
  delete el.dataset.mbrIntensity;
}

let tooltip: HTMLDivElement | null = null;
const WIRED = new WeakSet<HTMLElement>();

function attachTooltips(root: HTMLElement) {
  if (WIRED.has(root)) return;
  WIRED.add(root);
  const doc = root.ownerDocument;

  const show = (target: HTMLElement) => {
    if (root.dataset.mbrIntensity === "off") return;
    if (!tooltip || !tooltip.isConnected) {
      tooltip = doc.createElement("div");
      tooltip.className = "mbr-tooltip";
      tooltip.id = "mbr-tooltip";
      tooltip.setAttribute("role", "tooltip");
      tooltip.hidden = true;
      doc.body.appendChild(tooltip);
    }
    tooltip.replaceChildren(...target.dataset.mbrTip!.split("\n").map((line) => {
      const d = doc.createElement("div");
      d.textContent = line;
      return d;
    }));
    // Inherit the colour tokens of the annotated block (dark mode).
    const cs = getComputedStyle(root);
    tooltip.style.setProperty("--mbr-tip-bg", cs.getPropertyValue("--mbr-tip-bg"));
    tooltip.style.setProperty("--mbr-tip-fg", cs.getPropertyValue("--mbr-tip-fg"));
    tooltip.hidden = false;
    const r = target.getBoundingClientRect();
    const t = tooltip.getBoundingClientRect();
    const left = Math.min(Math.max(8, r.left + r.width / 2 - t.width / 2), innerWidth - t.width - 8);
    const above = r.top - t.height - 8;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${above > 8 ? above : r.bottom + 8}px`;
    target.setAttribute("aria-describedby", tooltip.id);
  };
  const hide = (target?: HTMLElement | null) => {
    if (tooltip) tooltip.hidden = true;
    target?.removeAttribute("aria-describedby");
  };
  const tipTarget = (e: Event) => (e.target as HTMLElement | null)?.closest?.("[data-mbr-tip]") as HTMLElement | null;

  root.addEventListener("mouseover", (e) => { const t = tipTarget(e); if (t) show(t); });
  root.addEventListener("mouseout", (e) => hide(tipTarget(e)));
  root.addEventListener("focusin", (e) => { const t = tipTarget(e); if (t) show(t); });
  root.addEventListener("focusout", (e) => hide(tipTarget(e)));
  doc.addEventListener("scroll", () => hide(), { passive: true, capture: true });
}
