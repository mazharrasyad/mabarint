import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";

const common = { bundle: true, target: "es2020", legalComments: "none", logLevel: "info" };
await build({ ...common, entryPoints: ["src/index.ts"], outfile: "dist/index.js", format: "esm" });
await build({ ...common, entryPoints: ["src/browser.ts"], outfile: "dist/mabarint.js", format: "iife", minify: true });

// The demo site serves the script-tag build at /mabarint/mabarint.js.
await mkdir("../../apps/web/public", { recursive: true });
await copyFile("dist/mabarint.js", "../../apps/web/public/mabarint.js");
