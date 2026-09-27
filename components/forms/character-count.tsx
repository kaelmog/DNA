import { cn } from '@/lib/utils'

/**
 * "120 / 4000" under a textarea. Link it with aria-describedby instead of a
 * live region, so screen readers read it on focus rather than on every key.
 */
export function CharacterCount({ id, count, max }: { id: string; count: number; max: number }) {
  const nearLimit = count > max * 0.9
  return (
    <p id={id} className={cn('text-right text-xs tabular-nums', nearLimit ? 'text-warning' : 'text-muted-foreground')}>
      {count.toLocaleString('en-US')} / {max.toLocaleString('en-US')} characters
    </p>
  )
}
