import type { ShippingAddress as ShippingAddressValue } from '@/lib/types'

/** A postal address as it would appear on a parcel label. */
export function ShippingAddress({ address }: { address: ShippingAddressValue }) {
  const cityLine = [address.city, address.state, address.postal_code].filter(Boolean).join(', ')
  const lines = [address.name, address.line1, address.line2, cityLine, address.country].filter(Boolean)

  return (
    <address className="text-sm leading-6 text-muted-foreground not-italic">
      {lines.map((line, index) => (
        <span key={index} className="block break-words">
          {line}
        </span>
      ))}
    </address>
  )
}
