import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: '/404', // Fallback or route to 404
      },
    ];
  },
};


export default nextConfig;
