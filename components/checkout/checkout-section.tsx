/** A numbered step of the checkout form ("1 Contact", "2 Shipping address"...). */
export function CheckoutSection({
  id,
  step,
  title,
  description,
  children,
}: {
  /** Prefix for the heading id, e.g. "checkout-contact". */
  id: string
  step: number
  title: string
  description?: React.ReactNode
  children: React.ReactNode
}) {
  const headingId = `${id}-heading`
  return (
    <section aria-labelledby={headingId} className="grid gap-5">
      <div className="grid gap-1.5">
        <h2 id={headingId} className="flex items-center gap-3 font-serif text-2xl tracking-tight">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-sans text-sm font-semibold text-primary-foreground"
          >
            {step}
          </span>
          <span className="sr-only">Step {step}: </span>
          {title}
        </h2>
        {description && <div className="text-sm text-muted-foreground sm:pl-11">{description}</div>}
      </div>
      {children}
    </section>
  )
}
