import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { cpus: 2 },
  outputFileTracingIncludes: {
    "/*": [
      "./server/config.json",
      "./server/seed.json",
      "./public/workspace.html",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
