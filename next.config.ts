import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Unsplash often times out through the Next image optimizer on this network.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "kqbtfexauvfijoqmnuxx.supabase.co" },
    ],
  },
};

export default nextConfig;
