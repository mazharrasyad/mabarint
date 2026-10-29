import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Served at https://mazharrasyad.tech/mabarint behind nginx.
  basePath: "/mabarint",
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
  transpilePackages: ["@mabarint/engine", "@mabarint/renderer", "@mabarint/types"],
  poweredByHeader: false,
  // The demos moved into tabs on /docs; keep the old links working.
  async redirects() {
    return [
      { source: "/meanings", destination: "/docs#meanings", permanent: false },
      { source: "/novel", destination: "/docs#novel", permanent: false },
      { source: "/news", destination: "/docs#news", permanent: false },
    ];
  },
};

export default nextConfig;
