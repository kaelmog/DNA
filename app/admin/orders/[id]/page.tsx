import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminNoteForm } from '@/components/admin/orders/admin-note-form'
import { FulfillmentForm } from '@/components/admin/orders/fulfillment-form'
import {
  OrderAddressCard,
  OrderCustomerCard,
  OrderCustomerNoteCard,
  OrderPaymentCard,
  OrderTimelineCard,
} from '@/components/admin/orders/order-info-cards'
import { OrderItemsCard } from '@/components/admin/orders/order-items-card'
import { OrderStatusForm } from '@/components/admin/orders/order-status-form'
import { canMarkAsPaid } from '@/components/admin/orders/status-rules'
import { StatusBadge } from '@/components/ui/badge'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { isCurrentUserAdmin, requireAdmin } from '@/lib/auth'
import { ORDER_STATUS } from '@/lib/constants'
import { getAdminOrder } from '@/lib/data/admin/orders'
import { formatDateTime, formatOrderNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { uuidField } from '@/lib/validation'

interface OrderPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { id } = await params
  // Only look the order up for admins; everyone else gets a 404 from the page anyway.
  const order = uuidField.safeParse(id).success && (await isCurrentUserAdmin()) ? await getAdminOrder(id) : null
  return { title: order ? `Order ${formatOrderNumber(order.order_number)}` : 'Order' }
}

export default async function AdminOrderPage({ params }: OrderPageProps) {
  await requireAdmin()

  const { id } = await params
  if (!uuidField.safeParse(id).success) notFound()

  const order = await getAdminOrder(id)
  if (!order) notFound()

  // While payment is outstanding, confirming it is the next step, so the Payment card goes first.
  const awaitingPayment = canMarkAsPaid(order.status)
  const paymentCard = <OrderPaymentCard order={order} />

  return (
    <>
      <AdminPageHeader
        backHref="/admin/orders"
        backLabel="All orders"
        title={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            Order {formatOrderNumber(order.order_number)}
            <StatusBadge meta={ORDER_STATUS[order.status]} />
          </span>
        }
        description={`Placed ${formatDateTime(order.created_at)}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-6 lg:col-span-2">
          <OrderItemsCard order={order} />

          <Card>
            <CardTitle>Fulfilment</CardTitle>
            <CardDescription className="mb-4">Add tracking details when the parcel leaves the studio.</CardDescription>
            <FulfillmentForm
              order={{
                id: order.id,
                status: order.status,
                email: order.email,
                carrier: order.carrier,
                tracking_number: order.tracking_number,
                tracking_url: order.tracking_url,
              }}
            />
          </Card>

          <OrderTimelineCard order={order} />
        </div>

        {/* On phones this column comes first while payment is outstanding, so "Mark as paid" is at the top. */}
        <div className={cn('grid content-start gap-6', awaitingPayment && 'order-first lg:order-none')}>
          {awaitingPayment && paymentCard}

          <Card>
            <CardTitle className="mb-4">Status</CardTitle>
            <OrderStatusForm
              orderId={order.id}
              status={order.status}
              wasPaid={Boolean(order.paid_at)}
              paidWithStripe={Boolean(order.stripe_payment_intent_id)}
            />
          </Card>

          {order.customer_note && <OrderCustomerNoteCard note={order.customer_note} />}
          <OrderCustomerCard order={order} />
          <OrderAddressCard order={order} />
          {!awaitingPayment && paymentCard}

          <Card>
            <CardTitle className="mb-4">Admin note</CardTitle>
            <AdminNoteForm orderId={order.id} note={order.admin_note} />
          </Card>
        </div>
      </div>
    </>
  )
}
