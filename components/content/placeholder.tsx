/**
 * Highlights text the store owner must replace before launch, e.g.
 *   <Placeholder>Your business legal name</Placeholder>  ->  [Your business legal name]
 * The square brackets make leftovers easy to spot and to search for.
 */
export function Placeholder({ children }: { children: string }) {
  return (
    <mark className="rounded bg-warning/15 px-1 font-medium text-warning" title="Replace this before launch">
      [{children}]
    </mark>
  )
}
