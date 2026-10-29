import type { Metadata } from "next";
import { Annotated, IntensityProvider, IntensityToggle } from "@/components/reader";
import { MEANINGS, mainStress } from "@/lib/demo";

export const metadata: Metadata = { title: "One sentence, many meanings" };

export default function MeaningsPage() {
  return (
    <IntensityProvider>
      <div className="wrap">
        <p className="eyebrow">Demo</p>
        <h1>One sentence, many meanings</h1>
        <p className="lead">
          “{MEANINGS.sentence}” has six readings, one for each word you can lean on. Each card below gives Muse Spark a
          different preceding context. The sentence is identical every time; only the stress moves.
        </p>
        <div className="toolbar"><IntensityToggle /></div>
        <div className="grid-2">
          {MEANINGS.variants.map((v) => {
            const stress = mainStress(v.annotation);
            return (
              <article className="card meaning" key={v.id}>
                <div className="context">{v.context}</div>
                <Annotated className="sentence" text={MEANINGS.sentence} spans={v.annotation.spans} />
                <div className="why">
                  {stress ? (
                    <><span className="pill">Stress: {stress.quote}</span> {stress.reason}</>
                  ) : (
                    <span className="muted">No stress marked.</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <p className="credit">Contexts written for Mabarint. Annotations precomputed with Muse Spark (muse-spark-1.3) through the Mabarint engine.</p>
      </div>
    </IntensityProvider>
  );
}
