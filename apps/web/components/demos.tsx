import { DemoCard } from "@/components/demo-card";
import { Annotated, IntensityProvider, IntensityToggle, Legend } from "@/components/reader";
import { DEMOS, MEANINGS, mainStress } from "@/lib/demo";

export function MeaningsDemo() {
  return (
    <IntensityProvider>
      <h2>One sentence, many meanings</h2>
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
    </IntensityProvider>
  );
}

export function NovelDemo() {
  return (
    <IntensityProvider>
      <div className="narrow-panel">
        <h2>Classic novels, read aloud in your head</h2>
        <p className="lead">
          Two public-domain scenes full of politeness that is not quite polite. Switch between Plain and Mabarint,
          and hover a marked word to read Muse Spark&apos;s reasoning.
        </p>
        <div className="toolbar"><IntensityToggle /></div>
        <div style={{ display: "grid", gap: 20 }}>
          <DemoCard demo={DEMOS.alice} />
          <DemoCard demo={DEMOS.pride} />
        </div>
        <section className="section">
          <h2>Notation guide</h2>
          <div className="card"><Legend /></div>
        </section>
      </div>
    </IntensityProvider>
  );
}

export function NewsDemo() {
  return (
    <IntensityProvider>
      <div className="narrow-panel">
        <h2>News: the voices carry feeling, the reporter stays neutral</h2>
        <p className="lead">
          In the news profile, emotion and stress are only allowed inside quotations from sources. The reporter&apos;s
          narration gets pauses and tempo only. The engine enforces this rule after Muse Spark answers, and political
          or war stories are refused.
        </p>
        <div className="toolbar"><IntensityToggle /></div>
        <div style={{ display: "grid", gap: 20 }}>
          <DemoCard demo={DEMOS.newsLibrary} />
          <DemoCard demo={DEMOS.newsBakery} />
          <DemoCard demo={DEMOS.newsRefusal} />
        </div>
      </div>
    </IntensityProvider>
  );
}
