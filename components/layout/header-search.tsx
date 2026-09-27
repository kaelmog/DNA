'use client'

import { Search, X } from 'lucide-react'
import Form from 'next/form'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/** Search icon that opens a full-width search bar. Submits to /shop?q=... */
export function HeaderSearch() {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        aria-label={open ? 'Close search' : 'Search'}
        aria-expanded={open}
        aria-controls="site-search"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="size-5" /> : <Search className="size-5" />}
      </Button>

      {open && (
        <div id="site-search" className="absolute inset-x-0 top-full border-b border-border bg-background shadow-sm">
          <Form
            action="/shop"
            role="search"
            className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-4 sm:px-6"
            onSubmit={() => setOpen(false)}
          >
            <label htmlFor="site-search-input" className="sr-only">
              Search products
            </label>
            <Input
              ref={inputRef}
              id="site-search-input"
              name="q"
              type="search"
              placeholder="Search wall hangings, plant hangers…"
              autoComplete="off"
              maxLength={100}
            />
            <Button type="submit">Search</Button>
          </Form>
        </div>
      )}
    </>
  )
}
