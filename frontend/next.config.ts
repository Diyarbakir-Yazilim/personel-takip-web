import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  allowedDevOrigins: [
    "192.168.56.1",
    "viewing-played-highs-nano.trycloudflare.com",
  ],
};

export default nextConfig;