import type { NextConfig } from 'next'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Supabase origin used by the Content Security Policy and next/image.
 * `*.supabase.co` covers every hosted project. If you put Supabase behind a
 * custom domain, setting NEXT_PUBLIC_SUPABASE_URL adds that origin too.
 */
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : ''

const contentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-inline' is required by Next.js inline bootstrap scripts unless you adopt nonces.
  `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"} https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://*.supabase.co ${supabaseOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co ${supabaseOrigin} https://va.vercel-scripts.com https://vitals.vercel-insights.com`,
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.stripe.com",
  "base-uri 'self'",
  "object-src 'none'",
  isProduction ? 'upgrade-insecure-requests' : '',
]
  .filter(Boolean)
  .join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      ...(supabaseOrigin ? [new URL(`${supabaseOrigin}/**`)] : []),
    ],
  },
  experimental: {
    serverActions: {
      // Custom-request reference images are capped at 4 MB in code; this leaves room for form overhead.
      bodySizeLimit: '5mb',
    },
  },
  // The /todo page reads the SQL files from disk so you can copy them from the browser.
  outputFileTracingIncludes: {
    '/todo': ['./supabase/**/*.sql'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  async redirects() {
    return [{ source: '/admin/dashboard', destination: '/admin', permanent: true }]
  },
}

export default nextConfig
