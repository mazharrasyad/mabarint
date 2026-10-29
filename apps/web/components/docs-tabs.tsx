"use client";

import { useEffect, useState, type ReactNode } from "react";

export interface DocsTab {
  id: string;
  label: string;
  content: ReactNode;
}

/** Tabs whose selection lives in the URL hash (/docs#novel), so every tab has a shareable link. */
export function DocsTabs({ tabs }: { tabs: DocsTab[] }) {
  const [active, setActive] = useState(tabs[0].id);

  useEffect(() => {
    const sync = () => {
      const id = location.hash.slice(1);
      if (tabs.some((t) => t.id === id)) setActive(id);
    };
    sync();
    addEventListener("hashchange", sync);
    return () => removeEventListener("hashchange", sync);
  }, [tabs]);

  const select = (id: string) => {
    setActive(id);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <>
      <div className="tabs docs-tabs" role="tablist" aria-label="Docs sections">
        {tabs.map((t) => (
          <button
            key={t.id} id={`tab-${t.id}`} role="tab" type="button"
            aria-selected={active === t.id} aria-controls={`panel-${t.id}`}
            onClick={() => select(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <section key={t.id} id={`panel-${t.id}`} role="tabpanel" aria-labelledby={`tab-${t.id}`} hidden={active !== t.id}>
          {t.content}
        </section>
      ))}
    </>
  );
}
