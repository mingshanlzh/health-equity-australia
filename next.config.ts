import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: "/health-equity-australia",
  assetPrefix: "/health-equity-australia",
};

export default nextConfig;
