import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

const CSP = [
  "default-src 'self'",
  "script-src 'self' https://static.line-scdn.net https://cdn.jsdelivr.net" + (isDev ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",       // Tailwind generates inline styles
  "img-src 'self' data: blob: https://*.supabase.co https://profile.line-scdn.net",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.line.me",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ')

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self), payment=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  ...(isDev ? [] : [
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  ]),
  { key: 'Content-Security-Policy', value: CSP },
]

const nextConfig: NextConfig = {
  output: 'standalone',           // VPS deployment — bundles server into .next/standalone
  poweredByHeader: false,
  productionBrowserSourceMaps: false,


  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  // Webpack: fail build if any server-only secret appears in client bundle
  webpack(config, { isServer }) {
    if (!isServer) {
      // Ensure server env vars don't leak to client
      config.plugins = config.plugins ?? []
    }
    return config
  },
}

export default nextConfig
