import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter, Literata } from "next/font/google";
import { Guide } from "@/components/guide";
import { Nav } from "@/components/nav";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const ui = Inter({ subsets: ["latin"], variable: "--font-ui", display: "swap" });
// Variable serif for reading text: smooth weight steps for stress levels.
const reading = Literata({ subsets: ["latin"], variable: "--font-reading", display: "swap", axes: ["opsz"] });

export const metadata: Metadata = {
  title: {
    default: "Mabarint | Authors write plain text. Readers hear the voice.",
    template: "%s | Mabarint",
  },
  description: "Mabarint uses Meta's Muse Spark to add tajwid-like notation for intonation and emotion to plain text.",
  // Hackathon demo: open to everyone, but kept out of search engines for now.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#14130f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${reading.variable}`}>
      <body>
        <ToastProvider>
          <header className="site-header">
            <div className="wrap">
              <Link href="/" className="brand">
                <img src="/mabarint/logo.svg" alt="" width={28} height={28} />
                Mabarint
              </Link>
              <Nav />
              <Guide />
            </div>
          </header>
          <main>{children}</main>
          <footer className="site-footer">
            <div className="wrap">
              Annotations by Meta Muse Spark · built with Claude Code · Meta Global AI Developer Hackathon (Oct 27 to Nov 4, 2026).{" "}
              <a href="https://github.com/mazharrasyad/mabarint">Source on GitHub</a> · MIT license
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
