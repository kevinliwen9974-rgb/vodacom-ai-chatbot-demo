import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // HTML pages must revalidate every load — otherwise a cached page
        // references chunk files that no longer exist after a redeploy and
        // the app half-breaks (buttons work, some handlers never resolve).
        // Static assets under /_next keep their default immutable caching.
        source: "/((?!_next/static|_next/image|api|brand|sites|favicon.ico).*)",
        headers: [
          { key: "Cache-Control", value: "no-cache, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
