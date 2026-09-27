import { JsonLd } from '@/components/seo/json-ld'
import { siteUrl } from '@/lib/env'
import { absoluteUrl } from '@/lib/seo'
import type { StoreSettings } from '@/lib/types'

/**
 * Organization + WebSite structured data for the home page. The SearchAction
 * lets search engines offer a search box that lands on /shop?q=...
 */
export function StoreJsonLd({ settings }: { settings: StoreSettings }) {
  const socialProfiles = [settings.instagram_url, settings.pinterest_url, settings.facebook_url, settings.tiktok_url].filter(
    (url): url is string => Boolean(url),
  )

  return (
    <JsonLd
      data={[
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: settings.store_name,
          url: siteUrl,
          logo: absoluteUrl('/icon.svg'),
          ...(settings.support_email ? { email: settings.support_email } : {}),
          ...(socialProfiles.length > 0 ? { sameAs: socialProfiles } : {}),
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: settings.store_name,
          url: siteUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/shop?q={search_term_string}` },
            'query-input': 'required name=search_term_string',
          },
        },
      ]}
    />
  )
}
