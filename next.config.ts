import type { NextConfig } from "next";

// Served by GitHub Pages under "/health-equity-australasia".
// If a custom domain is attached later (served at the root), set
// NEXT_PUBLIC_BASE_PATH="" at build time to override.
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ?? "/health-equity-australasia";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
};

export default nextConfig;
