import Link from 'next/link'

import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn('font-serif text-[28px] leading-none tracking-[-0.06em] text-espresso sm:text-3xl', className)}
      aria-label="Knotted Studio home"
    >
      knotted<span className="text-clay-light">.</span>
    </Link>
  )
}
