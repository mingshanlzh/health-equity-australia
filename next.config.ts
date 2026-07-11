import type { NextConfig } from "next";

// This repo is served by GitHub Pages under the "/health-equity-australia"
// sub-path, so basePath MUST be that path or every asset 404s.
// When a dedicated custom domain is attached (served at the root), set the
// env var NEXT_PUBLIC_BASE_PATH="" to override this default back to empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/health-equity-australia";

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
