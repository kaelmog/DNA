'use client'

import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'

export function CartButton() {
  const { count } = useCart()
  const label = count > 0 ? `Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}` : 'Shopping bag'

  return (
    <Link
      href="/cart"
      aria-label={label}
      className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'relative rounded-full' })}
    >
      <ShoppingBag className="size-5" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 flex size-[18px] items-center justify-center rounded-full bg-clay-light text-[10px] font-semibold text-white"
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
