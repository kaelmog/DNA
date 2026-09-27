import { Container } from '@/components/ui/misc'
import { cn } from '@/lib/utils'

/** Full-width call-to-action strip used at the bottom of content pages. */
export function CtaBand({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  /** Links or buttons. */
  actions: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('bg-linen/70', className)}>
      <Container className="flex flex-col items-start gap-6 py-14 sm:py-16 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h2 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">{title}</h2>
          {description && <p className="mt-3 leading-7 text-muted-foreground">{description}</p>}
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">{actions}</div>
      </Container>
    </section>
  )
}
