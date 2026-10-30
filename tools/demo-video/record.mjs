// Records the Mabarint demo on the live site, paced to the narration WAVs from tts.ps1,
// then mixes voice and video into out/mabarint-demo.mp4.
//   powershell -File tts.ps1   (once, or after editing narration.json)
//   node record.mjs
import { chromium } from "playwright";
import ffmpegPath from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

const SITE = process.env.SITE ?? "https://mazharrasyad.tech/mabarint";
const OUT = join(import.meta.dirname, "out");
const AUDIO = join(OUT, "audio");
const RAW = join(OUT, "raw");
const SIZE = { width: 1280, height: 720 };
const GAP = 700; // breath between narration segments, ms

const LIVE_TEXT = `"You're late," Grandma said, not looking up from her knitting. "Again."

Tom kissed her cheek. "I brought your favourite cake."

"Hmm," she said, and finally smiled. "Then you're forgiven. Barely."`;

const segments = JSON.parse(readFileSync(join(import.meta.dirname, "narration.json"), "utf8"));
const durationOf = (id) => {
  const b = readFileSync(join(AUDIO, `${id}.wav`));
  return ((b.length - 44) / b.readInt32LE(28)) * 1000;
};

// A visible cursor and click ripple: headless video does not draw the real pointer.
const CURSOR = `
  addEventListener("DOMContentLoaded", () => {
    const c = document.createElement("div");
    c.style.cssText = "position:fixed;left:-40px;top:-40px;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;" +
      "background:rgba(250,204,21,.35);border:2px solid #facc15;z-index:2147483647;pointer-events:none;transition:transform .12s";
    document.documentElement.appendChild(c);
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", () => { c.style.transform = "scale(.7)"; }, true);
    addEventListener("mouseup", () => { c.style.transform = "scale(1)"; }, true);
  });
  try { localStorage.setItem("mabarint.guideSeen.v1", "1"); } catch {}
`;

rmSync(RAW, { recursive: true, force: true });
mkdirSync(RAW, { recursive: true });

// The full Chromium build (new headless mode) renders fonts and video like a normal browser.
const browser = await chromium.launch({ channel: "chromium" });
const context = await browser.newContext({
  viewport: SIZE, colorScheme: "dark", deviceScaleFactor: 1,
  recordVideo: { dir: RAW, size: SIZE },
});
await context.addInitScript(CURSOR);
const videoStart = Date.now();
const page = await context.newPage();
const marks = [];

async function moveTo(locator, steps = 25) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
}
async function click(locator) {
  await moveTo(locator);
  await page.waitForTimeout(150);
  await locator.click();
}
/** Smooth scroll so `locator` sits near the top third of the screen. */
async function scrollTo(locator, ms = 1200) {
  await locator.evaluate((el, ms) => new Promise((done) => {
    const from = scrollY;
    const to = Math.max(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.28);
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      scrollTo(0, from + (to - from) * (0.5 - Math.cos(Math.PI * k) / 2));
      k < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  }), ms);
}
async function scrollTop(ms = 1000) {
  await page.evaluate((ms) => new Promise((done) => {
    const from = scrollY, t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / ms); scrollTo(0, from * (1 - (0.5 - Math.cos(Math.PI * k) / 2))); k < 1 ? requestAnimationFrame(step) : done(); };
    requestAnimationFrame(step);
  }), ms);
}
async function closeGuide() {
  const close = page.locator("dialog.guide[open] .guide-close");
  if (await close.count()) await close.click();
}
const panel = (id) => page.locator(`#panel-${id}`);
const toggle = (scope, label) => scope.locator(".segmented button", { hasText: label }).first();

/** Runs one narration segment: actions get `at(fraction)` to pace themselves across the voice-over. */
async function segment(id, actions) {
  const dur = durationOf(id);
  const start = Date.now();
  marks.push({ id, at: start - videoStart, dur });
  const at = async (f) => { const wait = start + f * dur - Date.now(); if (wait > 0) await page.waitForTimeout(wait); };
  await actions(at);
  const rest = start + dur + GAP - Date.now();
  if (rest > 0) await page.waitForTimeout(rest);
  console.log(`${id}: ${(dur / 1000).toFixed(1)}s voice, ${((Date.now() - start) / 1000).toFixed(1)}s on screen`);
}

// Pre-roll (trimmed away): open One sentence in Plain mode.
await page.goto(`${SITE}/docs#meanings`, { waitUntil: "networkidle" });
await closeGuide();
await toggle(panel("meanings"), "Plain").click();
await page.mouse.move(640, 360);
await page.waitForTimeout(800);

const firstCard = panel("meanings").locator(".card.meaning").first();

await segment("s1-hook", async (at) => {
  await scrollTo(firstCard, 1500);
  await at(0.35);
  await moveTo(firstCard.locator(".sentence"));
});

await segment("s2-meanings", async (at) => {
  await click(toggle(panel("meanings"), "Mabarint"));
  const cards = panel("meanings").locator(".card.meaning");
  const n = await cards.count();
  for (let i = 0; i < n; i++) {
    await at(0.18 + (i * 0.55) / n);
    await scrollTo(cards.nth(i), 700);
    await moveTo(cards.nth(i).locator("[class*=mbr-stress]").first(), 12);
  }
  // "Corrects who was accused" is the "she" card.
  await at(0.76);
  const she = cards.nth(3);
  await scrollTo(she, 600);
  await moveTo(she.locator(".sentence [class*=mbr-stress]").first(), 15);
});

await segment("s3-novel", async (at) => {
  await click(page.locator("#tab-novel"));
  const p = panel("novel");
  await toggle(p, "Plain").click();
  await scrollTo(p.locator(".card").first(), 900);
  await at(0.16);
  await click(toggle(p, "Mabarint"));
  await scrollTo(p.locator(".card").first().locator(".reading"), 700);
  await at(0.45);
  const civil = p.locator(".mbr-piece", { hasText: /^civil$/ }).first();
  await scrollTo(civil, 800);
  await moveTo(civil);
  await at(0.68);
  await moveTo(p.locator(".mbr-emo-anger").first());
  await at(0.86);
  await moveTo(p.locator("[data-mbr-tip][tabindex]").first(), 20);
});

await segment("s4-news", async (at) => {
  await click(page.locator("#tab-news"));
  const p = panel("news");
  await toggle(p, "Mabarint").click();
  await scrollTo(p.locator(".card").first(), 900);
  await at(0.15);
  await moveTo(p.locator(".mbr-piece", { hasText: /cried/ }).first());
  await at(0.45);
  await moveTo(p.locator(".card").first().locator("p.credit").first(), 20);
  await at(0.58);
  const bakery = p.locator(".card").nth(1);
  await scrollTo(bakery, 1200);
  await moveTo(bakery.locator(".mbr-emo").first());
});

await segment("s5-playground", async (at) => {
  await page.goto(`${SITE}/playground`, { waitUntil: "networkidle" });
  await closeGuide();
  const box = page.locator("#pg-text");
  await scrollTo(box, 600);
  await click(box);
  await box.fill("");
  await box.pressSequentially(LIVE_TEXT, { delay: 8 });
  await at(0.2);
  await click(page.locator("button.btn", { hasText: "Add reading marks" }));
  await page.locator(".toast.success, .toast.error").first().waitFor({ timeout: 60_000 });
  await page.waitForTimeout(1200);
  const result = page.locator("section .card .mbr").first();
  await scrollTo(result, 900);
  await moveTo(result.locator("[data-mbr-tip]").first());
  await at(0.7);
  await scrollTo(page.locator("#history-title"), 1200);
  await at(0.86);
  await page.goto(`${SITE}/docs#developers`, { waitUntil: "networkidle" });
  await scrollTo(panel("developers").locator("pre").first(), 800);
});

await segment("s6-close", async (at) => {
  await page.goto(SITE, { waitUntil: "networkidle" });
  await closeGuide();
  await page.mouse.move(1180, 650, { steps: 5 });
  await at(0.3);
  await scrollTo(page.locator("h2", { hasText: "Who it" }), 1600);
  await at(0.72);
  await scrollTop(1400);
});
await page.waitForTimeout(1500);

await context.close();
await browser.close();

// ---- Mix voice and video ----
const webm = readdirSync(RAW).find((f) => f.endsWith(".webm"));
renameSync(join(RAW, webm), join(RAW, "capture.webm"));
const trim = Math.max(0, marks[0].at - 400);
const end = marks.at(-1).at + marks.at(-1).dur + 2200;
const args = ["-y", "-ss", (trim / 1000).toFixed(3), "-i", join(RAW, "capture.webm")];
marks.forEach((m) => args.push("-i", join(AUDIO, `${m.id}.wav`)));
const delayed = marks.map((m, i) => `[${i + 1}:a]adelay=${Math.round(m.at - trim)}|${Math.round(m.at - trim)}[a${i}]`);
const filter = [
  ...delayed,
  `${marks.map((_, i) => `[a${i}]`).join("")}amix=inputs=${marks.length}:normalize=0,volume=1.6[voice]`,
  `[0:v]fps=30,format=yuv420p,fade=t=in:st=0:d=0.4,fade=t=out:st=${((end - trim) / 1000 - 0.8).toFixed(2)}:d=0.8[v]`,
].join(";");
args.push(
  "-filter_complex", filter, "-map", "[v]", "-map", "[voice]",
  "-t", ((end - trim) / 1000).toFixed(2),
  "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart",
  join(OUT, "mabarint-demo.mp4"),
);
execFileSync(ffmpegPath, args, { stdio: ["ignore", "ignore", "inherit"] });
console.log(`Saved ${join(OUT, "mabarint-demo.mp4")} (${((end - trim) / 1000).toFixed(1)}s)`);
