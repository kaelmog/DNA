import { ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/lib/types'

/** "Admin" stands out; regular customers get a quiet badge. */
export function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'admin') {
    return (
      <Badge tone="info">
        <ShieldCheck className="size-3" aria-hidden="true" /> Admin
      </Badge>
    )
  }
  return <Badge>Customer</Badge>
}
