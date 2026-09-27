import Form from 'next/form'
import Link from 'next/link'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/** Friendly 404 message with a product search and ways back. Used by both not-found pages. */
export function NotFoundContent() {
  return (
    <div className="mx-auto max-w-xl text-center">
      <p className="eyebrow mb-4">Error 404</p>
      <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
        This page came <em className="text-clay">unknotted.</em>
      </h1>
      <p className="mt-4 leading-7 text-muted-foreground">
        The page you are looking for may have moved or no longer exists. Try a search, or head back to the shop.
      </p>

      <Form action="/shop" role="search" className="mt-8 flex gap-2 text-left">
        <label htmlFor="not-found-search" className="sr-only">
          Search products
        </label>
        <Input
          id="not-found-search"
          name="q"
          type="search"
          placeholder="Search wall hangings, plant hangers…"
          maxLength={100}
        />
        <Button type="submit">Search</Button>
      </Form>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/shop" className={buttonVariants({ variant: 'accent' })}>
          Shop all pieces
        </Link>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Back to the home page
        </Link>
      </div>
    </div>
  )
}
