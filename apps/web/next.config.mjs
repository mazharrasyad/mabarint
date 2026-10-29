import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Served at https://mazharrasyad.tech/mabarint behind nginx.
  basePath: "/mabarint",
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
  transpilePackages: ["@mabarint/engine", "@mabarint/renderer", "@mabarint/types"],
  poweredByHeader: false,
};

export default nextConfig;
