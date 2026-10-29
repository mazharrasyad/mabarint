"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { render, setIntensity, LEGEND, EMOTION_LEGEND, EMOTION_COLORS, type Intensity } from "@mabarint/renderer";
import type { Span } from "@mabarint/types";

const IntensityContext = createContext<{ intensity: Intensity; set: (i: Intensity) => void }>({
  intensity: "full",
  set: () => {},
});

export function IntensityProvider({ children, initial = "full" }: { children: ReactNode; initial?: Intensity }) {
  const [intensity, set] = useState<Intensity>(initial);
  return <IntensityContext.Provider value={{ intensity, set }}>{children}</IntensityContext.Provider>;
}

export function useIntensity() {
  return useContext(IntensityContext);
}

const MODES: Array<{ id: Intensity; label: string; hint: string }> = [
  { id: "off", label: "Plain", hint: "The original plain text" },
  { id: "full", label: "Mabarint", hint: "Plain text with Mabarint notation" },
];

export function IntensityToggle() {
  const { intensity, set } = useIntensity();
  return (
    <div className="segmented" role="group" aria-label="Reading mode">
      {MODES.map((m) => (
        <button key={m.id} type="button" aria-pressed={intensity === m.id} title={m.hint} onClick={() => set(m.id)}>
          {m.label}
        </button>
      ))}
    </div>
  );
}

/** Plain text rendered with Mabarint notation. Follows the page's intensity unless `intensity` is given. */
export function Annotated({
  text, spans, intensity, className = "reading", as: Tag = "div",
}: {
  text: string;
  spans: Span[];
  intensity?: Intensity;
  className?: string;
  as?: "div" | "span" | "p";
}) {
  const ref = useRef<HTMLElement>(null);
  const ctx = useIntensity();
  const mode = intensity ?? ctx.intensity;

  useEffect(() => {
    if (ref.current) render(ref.current, { text, spans }, { intensity: mode });
    // Re-render only when the content changes; intensity is a cheap attribute switch below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, spans]);

  useEffect(() => {
    if (ref.current) setIntensity(ref.current, mode);
  }, [mode]);

  // Server HTML is the plain text, so the page is readable before hydration.
  return <Tag ref={ref as never} className={className}>{text}</Tag>;
}

export function Legend() {
  return (
    <div>
      <div className="legend">
        {LEGEND.map((item) => (
          <div className="legend-item" key={item.label}>
            <Annotated as="span" className="legend-sample" text={item.sample} spans={item.spans} intensity="full" />
            <span className="small">
              <strong>{item.label}</strong>{" "}
              <span className="muted">{item.description}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="legend-emotions" aria-label="Emotion underline colours">
        {EMOTION_LEGEND.map((e) => (
          <span className="swatch" key={e.emotion}>
            <i style={{ borderTopColor: EMOTION_COLORS[e.emotion].light, borderTopStyle: e.emotion === "sarcasm" ? "dashed" : "solid" }} />
            {e.label}
          </span>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>Hover or focus an annotated word to see why Muse Spark marked it.</p>
    </div>
  );
}
