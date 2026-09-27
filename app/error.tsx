'use client' // Error boundaries must be Client Components.

import { RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

import { Logo } from '@/components/layout/logo'
import { Button, buttonVariants } from '@/components/ui/button'
import { Container } from '@/components/ui/misc'

/**
 * Shown when a page throws while rendering. In production the error message
 * is hidden from visitors; `digest` matches the entry in the server logs.
 */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error('[app] page error', error)
  }, [error])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border/70">
        <Container className="flex h-16 items-center justify-center lg:h-20">
          <Logo />
        </Container>
      </header>
      <main id="main-content" className="flex flex-1 items-center">
        <Container className="py-16 sm:py-24">
          <div role="alert" className="mx-auto max-w-lg text-center">
            <p className="eyebrow mb-4">Something went wrong</p>
            <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              We dropped a stitch.
            </h1>
            <p className="mt-4 leading-7 text-muted-foreground">
              Sorry, this page could not be loaded. Please try again. If it keeps happening, let us know and we will
              look into it.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button variant="accent" onClick={() => retry()}>
                <RotateCcw aria-hidden="true" /> Try again
              </Button>
              <Link href="/" className={buttonVariants({ variant: 'outline' })}>
                Back to the home page
              </Link>
            </div>
            {error.digest && (
              <p className="mt-8 text-xs text-muted-foreground">
                Reference: <code className="font-mono">{error.digest}</code>
              </p>
            )}
          </div>
        </Container>
      </main>
    </div>
  )
}
