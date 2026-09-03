import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lqitnsvtqhsowvmaxjio.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://js.paystack.co https://*.paystack.co${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: blob: https://lqitnsvtqhsowvmaxjio.supabase.co https://*.paystack.co https://*.paystack.com",
      "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://lqitnsvtqhsowvmaxjio.supabase.co wss://lqitnsvtqhsowvmaxjio.supabase.co https://api.paystack.co https://checkout.paystack.com",
      "frame-src https://www.openstreetmap.org https://www.youtube.com https://player.vimeo.com https://checkout.paystack.com https://standard.paystack.co https://*.paystack.co https://*.paystack.com",
      "font-src 'self' data:",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      'upgrade-insecure-requests',
    ];

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; '),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=*, usb=()',
          },
        ],
      },
    ];
  },
};


export default nextConfig;
