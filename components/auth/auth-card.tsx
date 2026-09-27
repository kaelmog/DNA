/**
 * The card every sign-in / sign-up screen sits in. Renders the page's single h1.
 */
export function AuthCard({
  eyebrow,
  title,
  description,
  footer,
  children,
}: {
  eyebrow: string
  title: string
  description?: React.ReactNode
  /** Small print under the card body, e.g. "New here? Create an account". */
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-10">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>}
      <div className="mt-8">{children}</div>
      {footer && (
        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">{footer}</div>
      )}
    </div>
  )
}

/** Consistent style for the inline text links inside auth cards (with a 40px touch target). */
export const authLinkClassName =
  'inline-flex min-h-10 items-center font-medium text-clay underline-offset-4 hover:underline'
