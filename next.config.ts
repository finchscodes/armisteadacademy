import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, which would silently cap uploads well below our
      // 25MB faceclaim limit (src/actions/uploads.ts) — raise it to match.
      bodySizeLimit: "26mb",
    },
  },
};

export default nextConfig;
