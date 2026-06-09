import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (public buckets) — used once you wire up a project.
      { protocol: "https", hostname: "*.supabase.co" },
      // Allow Unsplash for optional demo imagery.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // Surface type issues at build time rather than hiding them.
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
