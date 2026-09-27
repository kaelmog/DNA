'use client'

import { CreditCard, Share2, Store, TriangleAlert, Truck, UserRound, type LucideIcon } from 'lucide-react'
import { useActionState, useState } from 'react'

import { updateSettings } from '@/app/admin/settings/actions'
import { SETTINGS_LIMITS, SOCIAL_FIELDS, STORE_CURRENCIES } from '@/components/admin/settings/settings-options'
import { CharacterCount } from '@/components/forms/character-count'
import { describedBy } from '@/components/forms/use-form-action'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { Checkbox, Input, Select, Textarea } from '@/components/ui/input'
import { initialActionState, type ActionState } from '@/lib/actions'
import { centsToDollars, formatMoney } from '@/lib/format'
import type { StoreSettings } from '@/lib/types'

/** On errors the submitted values are kept, because React resets a form after every action. */
type FormState = ActionState & { values?: FormData }

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linen text-clay">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
      <div className="grid gap-5">{children}</div>
    </Card>
  )
}

/**
 * The store settings form, grouped into cards. `stripeConfigured` only changes
 * the explanations in the Payments card; saving works the same either way.
 */
export function SettingsForm({
  settings,
  stripeConfigured,
  shippingCountryNames,
}: {
  settings: StoreSettings
  stripeConfigured: boolean
  /** Names of the saved shipping countries, e.g. "United States, Canada". */
  shippingCountryNames: string
}) {
  const [state, formAction] = useActionState<FormState, FormData>(async (_previous, formData) => {
    const result = await updateSettings(initialActionState, formData)
    return result.ok ? result : { ...result, values: formData }
  }, initialActionState)
  // Controlled, so the "prices are not converted" warning can react to a new choice.
  const [currency, setCurrency] = useState(settings.currency)
  const [announcementLength, setAnnouncementLength] = useState(settings.announcement_text?.length ?? 0)

  const errors = state.fieldErrors ?? {}
  const text = (name: string, saved: string | null) =>
    state.values ? String(state.values.get(name) ?? '') : (saved ?? '')
  const currencyCode = currency.toUpperCase()

  return (
    <form action={formAction} className="grid gap-6">
      <Section icon={Store} title="Store details" description="Your shop name and the words shown around the store.">
        <Field id="settings-store-name" label="Store name" required errors={errors.store_name}>
          <Input
            {...describedBy('settings-store-name', errors.store_name)}
            name="store_name"
            required
            maxLength={SETTINGS_LIMITS.storeName}
            autoComplete="organization"
            defaultValue={text('store_name', settings.store_name)}
          />
        </Field>
        <Field
          id="settings-tagline"
          label="Tagline"
          hint="A short line shown in the footer."
          errors={errors.tagline}
        >
          <Input
            {...describedBy('settings-tagline', errors.tagline, true)}
            name="tagline"
            maxLength={SETTINGS_LIMITS.tagline}
            defaultValue={text('tagline', settings.tagline)}
          />
        </Field>
        <Field
          id="settings-announcement"
          label="Announcement bar"
          hint="Shown in a thin bar at the top of every page. Leave empty to hide the bar."
          errors={errors.announcement_text}
        >
          <Input
            id="settings-announcement"
            name="announcement_text"
            maxLength={SETTINGS_LIMITS.announcement}
            placeholder="Free shipping on orders over $100"
            defaultValue={text('announcement_text', settings.announcement_text)}
            onChange={(event) => setAnnouncementLength(event.target.value.length)}
            aria-invalid={Boolean(errors.announcement_text?.length) || undefined}
            aria-describedby="settings-announcement-description settings-announcement-count"
          />
          <CharacterCount id="settings-announcement-count" count={announcementLength} max={SETTINGS_LIMITS.announcement} />
        </Field>
      </Section>

      <Section
        icon={UserRound}
        title="Contact"
        description="Shown on the Contact page and used as the reply-to address of store emails."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="settings-support-email" label="Support email" errors={errors.support_email}>
            <Input
              {...describedBy('settings-support-email', errors.support_email)}
              name="support_email"
              type="email"
              maxLength={SETTINGS_LIMITS.supportEmail}
              autoComplete="email"
              placeholder="hello@yourstudio.com"
              defaultValue={text('support_email', settings.support_email)}
            />
          </Field>
          <Field id="settings-support-phone" label="Support phone" errors={errors.support_phone}>
            <Input
              {...describedBy('settings-support-phone', errors.support_phone)}
              name="support_phone"
              type="tel"
              maxLength={SETTINGS_LIMITS.supportPhone}
              autoComplete="tel"
              defaultValue={text('support_phone', settings.support_phone)}
            />
          </Field>
        </div>
        <Field
          id="settings-address"
          label="Business address"
          hint="Line breaks are kept. Leave empty if you prefer not to show one."
          errors={errors.business_address}
        >
          <Textarea
            {...describedBy('settings-address', errors.business_address, true)}
            name="business_address"
            rows={3}
            maxLength={SETTINGS_LIMITS.businessAddress}
            autoComplete="street-address"
            defaultValue={text('business_address', settings.business_address)}
          />
        </Field>
      </Section>

      <Section icon={Truck} title="Shipping" description="One flat rate per order, with optional free shipping.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="settings-flat-shipping"
            label={`Flat shipping rate (${currencyCode})`}
            required
            hint="Charged once per order. Enter 0 for free shipping on everything."
            errors={errors.flat_shipping}
          >
            <Input
              {...describedBy('settings-flat-shipping', errors.flat_shipping, true)}
              name="flat_shipping"
              required
              inputMode="decimal"
              autoComplete="off"
              defaultValue={text('flat_shipping', centsToDollars(settings.flat_shipping_cents))}
            />
          </Field>
          <Field
            id="settings-free-threshold"
            label={`Free shipping from (${currencyCode})`}
            hint="Order subtotal (after discounts) that ships free. Leave empty for never."
            errors={errors.free_shipping_threshold}
          >
            <Input
              {...describedBy('settings-free-threshold', errors.free_shipping_threshold, true)}
              name="free_shipping_threshold"
              inputMode="decimal"
              autoComplete="off"
              defaultValue={text('free_shipping_threshold', centsToDollars(settings.free_shipping_threshold_cents))}
            />
          </Field>
        </div>
        <Field
          id="settings-countries"
          label="Countries you ship to"
          required
          hint={`Two-letter country codes separated by commas, for example US, CA, GB. Currently: ${shippingCountryNames}.`}
          errors={errors.allowed_shipping_countries}
        >
          <Input
            {...describedBy('settings-countries', errors.allowed_shipping_countries, true)}
            name="allowed_shipping_countries"
            required
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="uppercase"
            defaultValue={text('allowed_shipping_countries', settings.allowed_shipping_countries.join(', '))}
          />
        </Field>
        <Field
          id="settings-low-stock"
          label="Low-stock alert"
          required
          hint="Variants with this many or fewer in stock are flagged on the dashboard and product pages."
          errors={errors.low_stock_threshold}
          className="sm:max-w-xs"
        >
          <Input
            {...describedBy('settings-low-stock', errors.low_stock_threshold, true)}
            name="low_stock_threshold"
            type="number"
            required
            min={0}
            max={SETTINGS_LIMITS.maxLowStock}
            step={1}
            inputMode="numeric"
            defaultValue={text('low_stock_threshold', String(settings.low_stock_threshold))}
          />
        </Field>
      </Section>

      <Section
        icon={CreditCard}
        title="Payments and tax"
        description={
          stripeConfigured
            ? 'Customers pay by card through Stripe Checkout.'
            : 'Stripe is not connected yet: customers place their order, then pay you directly. Confirm each payment on the order page with “Mark as paid”.'
        }
      >
        <Field
          id="settings-currency"
          label="Currency"
          required
          hint="Used for every price in the store, in emails and at checkout."
          errors={errors.currency}
          className="sm:max-w-sm"
        >
          <Select
            {...describedBy('settings-currency', errors.currency, true)}
            name="currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          >
            {STORE_CURRENCIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        {currency !== settings.currency && (
          <p role="alert" className="flex gap-2.5 rounded-xl bg-warning/10 p-3 text-sm text-warning">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Prices are not converted: a piece priced at {formatMoney(10000, settings.currency)} will cost{' '}
              {formatMoney(10000, currency)}. Review your product prices, shipping rate and discount codes after saving.
            </span>
          </p>
        )}

        <label className="flex min-h-10 cursor-pointer items-start gap-3 rounded-xl bg-muted/60 p-3 text-sm">
          <Checkbox
            name="stripe_tax_enabled"
            className="mt-0.5"
            defaultChecked={state.values ? state.values.has('stripe_tax_enabled') : settings.stripe_tax_enabled}
            aria-describedby="settings-tax-description"
          />
          <span>
            <span className="font-medium">Calculate sales tax automatically with Stripe Tax</span>
            <span id="settings-tax-description" className="block text-xs text-muted-foreground">
              {stripeConfigured
                ? 'Stripe adds tax at checkout based on the customer’s address. Turn on Stripe Tax in your Stripe dashboard first.'
                : 'Only applies once Stripe is set up. Manual-payment orders are not taxed automatically.'}
            </span>
          </span>
        </label>
      </Section>

      <Section icon={Share2} title="Social" description="Profiles linked in the footer. Leave a field empty to hide it.">
        <div className="grid gap-5 sm:grid-cols-2">
          {SOCIAL_FIELDS.map((social) => {
            const id = `settings-${social.name}`
            return (
              <Field key={social.name} id={id} label={social.label} errors={errors[social.name]}>
                <Input
                  {...describedBy(id, errors[social.name])}
                  name={social.name}
                  type="url"
                  inputMode="url"
                  pattern="https://.+"
                  maxLength={SETTINGS_LIMITS.socialUrl}
                  placeholder={social.placeholder}
                  defaultValue={text(social.name, settings[social.name])}
                />
              </Field>
            )
          })}
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 grid gap-3 rounded-2xl border border-border bg-card/95 p-3 backdrop-blur sm:flex sm:items-center sm:justify-between">
        <FormMessage state={state} className="sm:order-2 sm:flex-1" />
        <SubmitButton pendingText="Saving…" className="w-full sm:order-1 sm:w-auto">
          Save settings
        </SubmitButton>
      </div>
    </form>
  )
}
