import { siteUrl } from '@/lib/env'

/** Turns a path ("/shop") or a public asset ("/macrame-hero.png") into an absolute URL. */
export function absoluteUrl(path = '/') {
  if (/^https?:\/\//.test(path)) return path
  return `${siteUrl}${path.startsWith('/') ? '' : '/'}${path}`
}
