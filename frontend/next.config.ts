import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },

  allowedDevOrigins: [
    "192.168.1.16",
    "192.168.1.108",
    "viewing-played-highs-nano.trycloudflare.com",
  ],
  output: "standalone",
  devIndicators: false,
};

export default nextConfig;