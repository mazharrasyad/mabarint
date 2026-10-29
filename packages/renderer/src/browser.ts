// Single <script> build: exposes window.Mabarint and renders [data-mabarint] elements on load.
//   <script src="https://host/mabarint/mabarint.js" data-endpoint="https://host/mabarint/api/annotate"></script>
import * as Mabarint from "./index";
import { autoInit } from "./auto";

(window as any).Mabarint = Mabarint;

const script = document.currentScript as HTMLScriptElement | null;
const endpoint = script?.dataset.endpoint;
const start = () => autoInit({ endpoint });
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();
