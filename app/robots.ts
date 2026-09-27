import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib/seo'

/**
 * robots.txt: search engines may crawl the shop but not private areas.
 * These pages also send "noindex" themselves; this just saves crawl budget.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/account', '/cart', '/checkout', '/api', '/auth', '/todo', '/reset-password'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
