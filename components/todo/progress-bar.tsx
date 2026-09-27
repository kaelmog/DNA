import { cn } from '@/lib/utils'

/** Thin progress bar with an accessible "3 of 5 done" value. Turns green when complete. */
export function ProgressBar({
  done,
  total,
  label,
  className,
}: {
  done: number
  total: number
  label: string
  className?: string
}) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={`${done} of ${total} done`}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-300', done === total ? 'bg-success' : 'bg-clay')}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
