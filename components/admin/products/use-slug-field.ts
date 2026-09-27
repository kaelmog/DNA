'use client'

import { useState } from 'react'

import { slugify } from '@/lib/format'

/**
 * Name + slug inputs that stay in sync: the slug follows the name until the
 * admin types their own. Saved records start with their own slug, so renaming
 * a live product or category never silently changes its public address.
 * Clearing the slug hands it back to the name. Shared by the product and
 * category forms.
 */
export function useSlugField(initial: { name: string; slug: string }) {
  const [name, setName] = useState(initial.name)
  const [slug, setSlug] = useState(initial.slug)
  const [followsName, setFollowsName] = useState(initial.slug === '')

  function changeName(value: string) {
    setName(value)
    if (followsName) setSlug(slugify(value))
  }

  function changeSlug(value: string) {
    setSlug(value)
    setFollowsName(value.trim() === '')
  }

  /** On blur: tidies a hand-typed slug ("My Piece " -> "my-piece"), or refills an empty one from the name. */
  function normalizeSlug() {
    setSlug((current) => slugify(current) || slugify(name))
  }

  return { name, slug, followsName, changeName, changeSlug, normalizeSlug }
}
