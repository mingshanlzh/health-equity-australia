import type { NextConfig } from "next";

// basePath is only needed when the site is served from a sub-path,
// e.g. the GitHub Pages project preview at /health-equity-australia.
// On a custom domain it MUST be empty, or every asset and link 404s.
// Set NEXT_PUBLIC_BASE_PATH in CI only for the project-path preview.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
};

export default nextConfig;
