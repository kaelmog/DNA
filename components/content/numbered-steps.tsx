import { cn } from '@/lib/utils'

export interface NumberedStep {
  title: string
  description: string
}

/** A short ordered "how it works" list with large serif numbers. */
export function NumberedSteps({ steps, className }: { steps: NumberedStep[]; className?: string }) {
  return (
    <ol className={cn('grid gap-5', className)}>
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-4">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card font-serif text-lg text-clay ring-1 ring-border"
          >
            {index + 1}
          </span>
          <div className="pt-1.5">
            <h3 className="font-semibold">
              <span className="sr-only">Step {index + 1}: </span>
              {step.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
