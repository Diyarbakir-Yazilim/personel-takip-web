import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  allowedDevOrigins: [
    "viewing-played-highs-nano.trycloudflare.com",
  ],
};

export default nextConfig;