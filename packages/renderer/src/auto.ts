import { isRefusal, type AnnotationResult } from "@mabarint/types";
import { render, setIntensity } from "./render";
import type { Intensity } from "./styles";

export interface AutoInitOptions {
  /** POST endpoint of the annotation engine, e.g. https://host/mabarint/api/annotate. */
  endpoint?: string;
  root?: ParentNode;
}

/**
 * Finds every `[data-mabarint]` element and renders it.
 *
 *   <div data-mabarint="novel">Plain text…</div>                 → calls the engine endpoint
 *   <div data-mabarint data-mabarint-src="/demo.json">…</div>     → uses precomputed JSON
 *   data-mabarint-intensity="off|full"   data-mabarint-controls   (adds a Plain / Mabarint toggle)
 */
export async function autoInit(options: AutoInitOptions = {}): Promise<void> {
  const root = options.root ?? document;
  const els = [...root.querySelectorAll<HTMLElement>("[data-mabarint]")].filter((el) => !el.dataset.mabarintDone);
  await Promise.all(els.map(async (el) => {
    el.dataset.mabarintDone = "1";
    const text = el.textContent ?? "";
    const intensity = (el.dataset.mabarintIntensity as Intensity) || "full";
    try {
      const src = el.dataset.mabarintSrc;
      const endpoint = el.dataset.mabarintEndpoint ?? options.endpoint;
      let result: AnnotationResult;
      if (src) {
        result = await (await fetch(src)).json();
      } else if (endpoint) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ text, profile: el.dataset.mabarint || "novel", code: el.dataset.mabarintCode }),
        });
        result = await res.json();
        if (!res.ok) throw new Error((result as any).error ?? res.statusText);
      } else {
        throw new Error("Set data-mabarint-src or an endpoint");
      }
      if (isRefusal(result)) {
        el.title = `Mabarint: ${result.reason}`;
        return;
      }
      render(el, { spans: result.spans, text: result.text ?? text }, { intensity });
      if ("controls" in el.dataset || "mabarintControls" in el.dataset) el.before(controls(el, intensity));
    } catch (e) {
      // Leave the plain text untouched; annotation is an enhancement.
      console.warn("[mabarint]", (e as Error).message);
    }
  }));
}

function controls(target: HTMLElement, initial: Intensity): HTMLElement {
  const bar = document.createElement("div");
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Mabarint notation");
  bar.style.cssText = "display:inline-flex;gap:4px;margin:0 0 8px;font:13px system-ui,sans-serif";
  const modes: Array<[Intensity, string]> = [["off", "Plain"], ["full", "Mabarint"]];
  const buttons = modes.map(([mode, label]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.setAttribute("aria-pressed", String(mode === initial));
    b.style.cssText = "padding:4px 10px;border:1px solid currentColor;border-radius:999px;background:none;color:inherit;cursor:pointer";
    b.onclick = () => {
      setIntensity(target, mode);
      buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    };
    return b;
  });
  bar.append(...buttons);
  return bar;
}
