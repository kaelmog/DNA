/**
 * Structured data for search engines (schema.org). Render it anywhere in a page:
 *   <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Product', ... }} />
 * `<` is escaped so user-provided text can never close the script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
