import { Annotated } from "@/components/reader";
import { spansOf, type Demo } from "@/lib/demo";

export function DemoCard({ demo }: { demo: Demo }) {
  const a = demo.annotation;
  return (
    <article className="card">
      <h2 style={{ marginTop: 0 }}>{demo.title}</h2>
      {"refused" in a && a.refused ? (
        <>
          <div className="reading muted" style={{ whiteSpace: "pre-wrap" }}>{demo.text}</div>
          <p className="notice refused" style={{ marginTop: 14 }}>
            <strong>Refused by the news profile.</strong> {a.reason}
          </p>
        </>
      ) : (
        <>
          <Annotated text={demo.text} spans={spansOf(demo)} />
          <p className="credit">
            {"tone" in a && a.tone ? <>Tone: <strong>{a.tone}</strong> · </> : null}
            {spansOf(demo).length} marks · {a.meta?.model ?? "muse-spark"}
          </p>
        </>
      )}
      <p className="credit">{demo.credit}</p>
    </article>
  );
}
