import Link from "next/link";
import { Annotated, IntensityProvider, IntensityToggle, Legend } from "@/components/reader";
import { DEMOS, MEANINGS, mainStress, spansOf } from "@/lib/demo";

const AUDIENCE = [
  { title: "Readers", text: "Catch the sarcasm, the pause before bad news, the word that carries the meaning." },
  { title: "English learners", text: "See where a native speaker would stress a word or let their voice rise." },
  { title: "Reading aloud", text: "Read a story to a child, or a speech to a room, with the right rhythm and feeling." },
];

export default function Home() {
  const demo = DEMOS.home;
  const preview = MEANINGS.variants.slice(0, 3);
  return (
    <IntensityProvider>
      <div className="wrap">
        <p className="eyebrow">Powered by Meta Muse Spark</p>
        <h1>Authors write plain text.<br />Readers hear the voice.</h1>
        <p className="lead">
          The same words can sound kind, angry or sarcastic. On a screen you can&apos;t tell. Mabarint adds small
          reading marks to any text, a little like tajwid in the Qur&apos;an, so you know which word to stress, where to
          pause, and what the speaker feels.
        </p>
        <div className="row" style={{ marginBottom: 8 }}>
          <Link href="/playground" className="btn">Try it with your own text</Link>
          <Link href="/docs" className="btn ghost">See more examples</Link>
        </div>

        <section className="section">
          <h2>See the difference</h2>
          <div className="toolbar">
            <IntensityToggle />
            <span className="small muted">Switch between Plain and Mabarint. Hover or tap a marked word to see why.</span>
          </div>
          <div className="grid-2">
            <div className="card">
              <div className="label">Plain text</div>
              <div className="reading" style={{ whiteSpace: "pre-wrap" }}>{demo.text}</div>
            </div>
            <div className="card">
              <div className="label">With Mabarint</div>
              <Annotated text={demo.text} spans={spansOf(demo)} />
            </div>
          </div>
        </section>

        <section className="section">
          <h2>One sentence, many meanings</h2>
          <p className="muted">
            The same seven words mean different things depending on what came before. Mabarint moves the stress to the
            word that matters.{" "}
            <Link href="/docs#meanings">See all six →</Link>
          </p>
          <div className="grid-3">
            {preview.map((v) => {
              const stress = mainStress(v.annotation);
              return (
                <div className="card meaning" key={v.id}>
                  <Annotated className="sentence" text={MEANINGS.sentence} spans={v.annotation.spans} intensity="full" />
                  {stress?.reason && <div className="why"><strong>{stress.quote}</strong>: {stress.reason}</div>}
                </div>
              );
            })}
          </div>
        </section>

        <section className="section">
          <h2>How to use it</h2>
          <div className="steps">
            <div className="card">
              <h3>Paste your text</h3>
              <p className="muted small">A story, a news article or a speech, up to 1,000 characters. No sign-up.</p>
            </div>
            <div className="card">
              <h3>Muse Spark reads it</h3>
              <p className="muted small">Meta&apos;s AI reads it like a narrator: who is speaking, what they feel, and what they really mean.</p>
            </div>
            <div className="card">
              <h3>Read with the marks</h3>
              <p className="muted small">Reading marks appear on your text. Tap or hover any marked word to see why it was marked.</p>
            </div>
          </div>
          <p style={{ marginTop: 16 }}><Link href="/playground" className="btn">Open the Playground</Link></p>
        </section>

        <section className="section">
          <h2>Who it&apos;s for</h2>
          <div className="grid-3">
            {AUDIENCE.map((a) => (
              <div className="card" key={a.title}>
                <h3>{a.title}</h3>
                <p className="muted small" style={{ margin: 0 }}>{a.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>What the marks mean</h2>
          <div className="card"><Legend /></div>
          <p className="small muted" style={{ marginTop: 16 }}>
            Building a reading app or a website? <Link href="/docs#developers">Developer docs →</Link>
          </p>
        </section>
      </div>
    </IntensityProvider>
  );
}
