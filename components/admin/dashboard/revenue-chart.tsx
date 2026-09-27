import { ChartColumn } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/misc'
import { formatDate, formatMoney, pluralize } from '@/lib/format'
import type { DashboardData } from '@/lib/types'
import { cn } from '@/lib/utils'

interface RevenueChartProps {
  daily: DashboardData['daily']
  currency: string
  days: number
  /** False until the store's first sale: shows a friendly empty state instead of a flat line. */
  hasSales: boolean
}

// Days arrive as "YYYY-MM-DD" (UTC dates), so format them in UTC to avoid off-by-one days.
const shortDay = (day: string) => formatDate(day, { month: 'short', day: 'numeric', timeZone: 'UTC' })
const longDay = (day: string) =>
  formatDate(day, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })

/** Rounds up to 1, 2, 2.5 or 5 x 10^n so the axis shows clean amounts. */
function niceCeiling(cents: number) {
  if (cents <= 0) return 10_000
  const magnitude = 10 ** Math.floor(Math.log10(cents))
  const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude >= cents) ?? 10
  return step * magnitude
}

function compactMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(cents / 100)
}

/** Keeps hover tooltips inside the card: left-aligned at the start, right-aligned at the end. */
function tooltipPosition(index: number, count: number) {
  if (index < count / 3) return 'left-0'
  if (index >= (count * 2) / 3) return 'right-0'
  return 'left-1/2 -translate-x-1/2'
}

/**
 * Daily revenue as CSS columns. The drawing is decorative for assistive tech
 * (aria-hidden); screen readers get the same numbers from a visually hidden table.
 */
export function RevenueChart({ daily, currency, days, hasSales }: RevenueChartProps) {
  const peak = Math.max(0, ...daily.map((day) => day.revenue_cents))
  const axisMax = niceCeiling(peak)
  const bestDay = peak > 0 ? daily.find((day) => day.revenue_cents === peak) : undefined

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div>
          <CardTitle>Revenue, last {days} days</CardTitle>
          <CardDescription>Paid orders per day, after refunds.</CardDescription>
        </div>
      </CardHeader>

      {!hasSales || daily.length === 0 ? (
        <EmptyState
          icon={<ChartColumn />}
          title="No sales yet"
          description="Daily revenue will appear here after your first paid order."
          className="py-10"
        />
      ) : (
        <figure>
          <div aria-hidden="true">
            <div className="flex h-44 gap-2 sm:h-56">
              {/* Y axis: 0, half and the rounded maximum */}
              <div className="relative w-11 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
                <span className="absolute top-0 right-0 -translate-y-1/2">{compactMoney(axisMax, currency)}</span>
                <span className="absolute top-1/2 right-0 -translate-y-1/2">{compactMoney(axisMax / 2, currency)}</span>
                <span className="absolute right-0 bottom-0 translate-y-1/2">{compactMoney(0, currency)}</span>
              </div>

              {/* Plot area with hairline gridlines */}
              <div className="relative min-w-0 flex-1">
                <div className="absolute inset-x-0 top-0 border-t border-border" />
                <div className="absolute inset-x-0 top-1/2 border-t border-border" />
                <div className="absolute inset-x-0 bottom-0 border-t border-input" />

                <div className="absolute inset-0 flex items-end gap-0.5">
                  {daily.map((day, index) => (
                    <div key={day.day} className="group relative flex h-full min-w-0 flex-1 items-end justify-center">
                      {day.revenue_cents > 0 && (
                        <div
                          className="w-full max-w-6 rounded-t-[4px] bg-clay transition-colors group-hover:bg-clay-dark"
                          style={{ height: `${Math.max((day.revenue_cents / axisMax) * 100, 1.5)}%` }}
                        />
                      )}
                      <div
                        className={cn(
                          'pointer-events-none absolute bottom-full z-10 mb-2 hidden w-max rounded-lg bg-espresso px-2.5 py-1.5 text-xs shadow-md group-hover:block',
                          tooltipPosition(index, daily.length),
                        )}
                      >
                        <span className="block font-semibold text-cream">
                          {formatMoney(day.revenue_cents, currency)}
                        </span>
                        <span className="block text-sand">
                          {longDay(day.day)} · {pluralize(day.orders, 'order')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-2 flex justify-between pl-13 text-xs text-muted-foreground">
              <span>{shortDay(daily[0].day)}</span>
              <span>{shortDay(daily[daily.length - 1].day)}</span>
            </div>
          </div>

          <figcaption className="mt-4 text-sm text-muted-foreground">
            {bestDay ? (
              <>
                Best day: <span className="font-medium text-foreground">{longDay(bestDay.day)}</span>,{' '}
                {formatMoney(bestDay.revenue_cents, currency)} from {pluralize(bestDay.orders, 'order')}.
              </>
            ) : (
              `No sales in the last ${days} days.`
            )}
          </figcaption>

          <table className="sr-only">
            <caption>Revenue per day for the last {days} days</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Revenue</th>
                <th scope="col">Orders</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((day) => (
                <tr key={day.day}>
                  <th scope="row">{longDay(day.day)}</th>
                  <td>{formatMoney(day.revenue_cents, currency)}</td>
                  <td>{day.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      )}
    </Card>
  )
}
