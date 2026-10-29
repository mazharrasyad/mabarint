import type { Metadata } from "next";
import { MeaningsDemo, NewsDemo, NovelDemo } from "@/components/demos";
import { DeveloperDocs } from "@/components/developer-docs";
import { DocsTabs } from "@/components/docs-tabs";

export const metadata: Metadata = { title: "Docs" };

export default function DocsPage() {
  return (
    <div className="wrap">
      <p className="eyebrow">Docs</p>
      <h1>See Mabarint at work</h1>
      <p className="lead">
        Real text annotated by Meta Muse Spark. Pick a tab, switch between Plain and Mabarint, and hover a marked
        word to read why it was marked.
      </p>
      <DocsTabs
        tabs={[
          { id: "meanings", label: "One sentence", content: <MeaningsDemo /> },
          { id: "novel", label: "Novel", content: <NovelDemo /> },
          { id: "news", label: "News", content: <NewsDemo /> },
          { id: "developers", label: "Developers", content: <DeveloperDocs /> },
        ]}
      />
    </div>
  );
}
