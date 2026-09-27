'use client'

import { Plus, Trash } from 'lucide-react'
import { useState } from 'react'

import { MAX_PRODUCT_VARIANTS } from '@/components/admin/products/constants'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Checkbox, Input } from '@/components/ui/input'
import { centsToDollars } from '@/lib/format'
import type { ProductVariant } from '@/lib/types'

/** One editable variant. Numbers stay strings while typing; the server validates them. */
interface VariantRow {
  key: string
  id?: string
  title: string
  sku: string
  price: string
  compareAtPrice: string
  inventory: string
  /** Stock when the form loaded (null for new rows). Unchanged stock is not re-written on save. */
  initialInventory: string | null
  trackInventory: boolean
  isActive: boolean
}

function toRow(variant: ProductVariant): VariantRow {
  return {
    key: variant.id,
    id: variant.id,
    title: variant.title,
    sku: variant.sku ?? '',
    price: centsToDollars(variant.price_cents),
    compareAtPrice: centsToDollars(variant.compare_at_price_cents),
    inventory: String(variant.inventory_quantity),
    initialInventory: String(variant.inventory_quantity),
    trackInventory: variant.track_inventory,
    isActive: variant.is_active,
  }
}

function newRow(key: string, title = ''): VariantRow {
  return {
    key,
    title,
    sku: '',
    price: '',
    compareAtPrice: '',
    inventory: '1',
    initialInventory: null,
    trackInventory: true,
    isActive: true,
  }
}

/** The JSON the server action reads from the hidden "variants" input. Position = list order. */
function serialize(rows: VariantRow[]) {
  return JSON.stringify(
    rows.map((row) => ({
      id: row.id,
      title: row.title,
      sku: row.sku,
      price: row.price,
      compare_at_price: row.compareAtPrice,
      inventory_quantity: row.inventory,
      stock_changed: row.initialInventory === null || row.inventory.trim() !== row.initialInventory,
      track_inventory: row.trackInventory,
      is_active: row.isActive,
    })),
  )
}

interface VariantsEditorProps {
  initialVariants: ProductVariant[]
  currency: string
  /** Messages from the server, e.g. "Variant 2: Price is required." */
  errors?: string[]
}

/** Sellable versions of a product (size, colour...), each with its own price, SKU and stock. */
export function VariantsEditor({ initialVariants, currency, errors }: VariantsEditorProps) {
  const [rows, setRows] = useState<VariantRow[]>(() =>
    initialVariants.length ? initialVariants.map(toRow) : [newRow('new-first', 'Default')],
  )
  const currencyCode = currency.toUpperCase()

  function updateRow(key: string, patch: Partial<VariantRow>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function addRow() {
    setRows((current) => [...current, newRow(`new-${crypto.randomUUID()}`)])
  }

  function removeRow(key: string) {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.key !== key) : current))
  }

  return (
    <div className="grid gap-4">
      <input type="hidden" name="variants" value={serialize(rows)} />

      {errors?.length ? (
        <ul role="alert" className="grid gap-1 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {rows.map((row, index) => {
        const id = (field: string) => `variant-${row.key}-${field}`
        const headingId = id('heading')
        return (
          <div
            key={row.key}
            role="group"
            aria-labelledby={headingId}
            className="rounded-2xl border border-border bg-background/60 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 id={headingId} className="text-sm font-semibold">
                Variant {index + 1}
                {!row.isActive && <span className="font-normal text-muted-foreground"> · hidden from the shop</span>}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-10 text-muted-foreground hover:text-destructive"
                aria-label={`Remove variant ${index + 1}`}
                disabled={rows.length === 1}
                onClick={() => removeRow(row.key)}
              >
                <Trash />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Field id={id('title')} label="Title" className="col-span-2">
                <Input
                  id={id('title')}
                  value={row.title}
                  maxLength={120}
                  placeholder="e.g. Large, Natural cotton"
                  onChange={(event) => updateRow(row.key, { title: event.target.value })}
                />
              </Field>
              <Field id={id('sku')} label="SKU" hint="Optional, must be unique" className="col-span-2">
                <Input
                  id={id('sku')}
                  value={row.sku}
                  maxLength={64}
                  autoCapitalize="characters"
                  spellCheck={false}
                  aria-describedby={`${id('sku')}-description`}
                  onChange={(event) => updateRow(row.key, { sku: event.target.value })}
                />
              </Field>
              <Field id={id('price')} label={`Price (${currencyCode})`} required>
                <Input
                  id={id('price')}
                  value={row.price}
                  inputMode="decimal"
                  placeholder="0.00"
                  required
                  onChange={(event) => updateRow(row.key, { price: event.target.value })}
                />
              </Field>
              <Field id={id('compare')} label="Compare-at price" hint="Optional, shows a sale">
                <Input
                  id={id('compare')}
                  value={row.compareAtPrice}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-describedby={`${id('compare')}-description`}
                  onChange={(event) => updateRow(row.key, { compareAtPrice: event.target.value })}
                />
              </Field>
              <Field id={id('stock')} label="In stock" hint={row.trackInventory ? undefined : 'Made to order'}>
                <Input
                  id={id('stock')}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={row.inventory}
                  disabled={!row.trackInventory}
                  aria-describedby={row.trackInventory ? undefined : `${id('stock')}-description`}
                  onChange={(event) => updateRow(row.key, { inventory: event.target.value })}
                />
              </Field>
              <div className="flex flex-col justify-end gap-1">
                <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={row.trackInventory}
                    onChange={(event) => updateRow(row.key, { trackInventory: event.target.checked })}
                  />
                  Track stock
                </label>
                <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={row.isActive}
                    onChange={(event) => updateRow(row.key, { isActive: event.target.checked })}
                  />
                  For sale
                </label>
              </div>
            </div>
          </div>
        )
      })}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Most pieces need one variant. Add more for sizes or colours.
        </p>
        <Button type="button" variant="outline" onClick={addRow} disabled={rows.length >= MAX_PRODUCT_VARIANTS}>
          <Plus aria-hidden="true" /> Add variant
        </Button>
      </div>
    </div>
  )
}
