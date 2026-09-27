'use client' // Error boundaries must be Client Components.

import './globals.css'

import { useEffect } from 'react'

/**
 * Last-resort error page, used when the root layout itself fails. It replaces
 * the root layout, so it renders its own <html> and <body>, imports the global
 * styles itself and avoids components that might be the cause of the failure.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error('[app] root layout error', error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center bg-background px-4 font-sans text-foreground antialiased">
        {/* metadata exports are not supported here, so set the title directly. */}
        <title>Something went wrong · Knotted Studio</title>
        <main role="alert" className="max-w-md py-16 text-center">
          <p className="font-serif text-3xl tracking-tight text-espresso">
            knotted<span className="text-clay-light">.</span>
          </p>
          <h1 className="mt-10 font-serif text-4xl leading-tight tracking-tight">Something went wrong.</h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            Sorry, the shop could not be loaded right now. Please try again in a moment.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => retry()}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-clay px-5 text-sm font-semibold text-white hover:bg-clay-dark"
            >
              Try again
            </button>
            {/*
              Deliberately a plain <a>, not <Link>: only a full page load recovers from a root layout
              crash. Next clears this screen only when the pathname changes (so a soft navigation from
              "/" to "/" does nothing) and reuses the failed root layout on client-side navigations.
              A real link also keeps working if JavaScript itself is what broke.
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full page load required, see above */}
            <a
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-input bg-card px-5 text-sm font-semibold hover:bg-accent"
            >
              Back to the home page
            </a>
          </div>
          {error.digest && (
            <p className="mt-8 text-xs text-muted-foreground">
              Reference: <code className="font-mono">{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  )
}
