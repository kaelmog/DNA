import { describedBy } from '@/components/forms/use-form-action'
import { Field } from '@/components/ui/field'
import { Input, Select } from '@/components/ui/input'
import type { CheckoutCountry } from '@/lib/checkout/types'

/**
 * Contact and shipping inputs of the manual checkout form. They are
 * uncontrolled: the form reads them with FormData on submit, and the `name`s
 * match the keys the server reports errors for (see manualOrderFieldErrors).
 */

type FieldErrors = Record<string, string[] | undefined>

export interface ContactDefaults {
  email: string
  fullName: string
  phone: string
}

export function ContactFields({ defaults, errors }: { defaults: ContactDefaults; errors: FieldErrors }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field
        id="checkout-email"
        label="Email"
        required
        hint="We’ll send your order details and payment instructions here."
        errors={errors.email}
        className="sm:col-span-2"
      >
        <Input
          {...describedBy('checkout-email', errors.email, true)}
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          defaultValue={defaults.email}
        />
      </Field>

      <Field id="checkout-full-name" label="Full name" required errors={errors.fullName}>
        <Input
          {...describedBy('checkout-full-name', errors.fullName)}
          name="fullName"
          required
          maxLength={120}
          autoComplete="name"
          defaultValue={defaults.fullName}
        />
      </Field>

      <Field id="checkout-phone" label="Phone" hint="Optional, only used for delivery questions." errors={errors.phone}>
        <Input
          {...describedBy('checkout-phone', errors.phone, true)}
          name="phone"
          type="tel"
          maxLength={40}
          autoComplete="tel"
          defaultValue={defaults.phone}
        />
      </Field>
    </div>
  )
}

export function ShippingFields({ countries, errors }: { countries: CheckoutCountry[]; errors: FieldErrors }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field id="checkout-line1" label="Address" required errors={errors.line1} className="sm:col-span-2">
        <Input
          {...describedBy('checkout-line1', errors.line1)}
          name="line1"
          required
          maxLength={200}
          autoComplete="address-line1"
          placeholder="Street and house number"
        />
      </Field>

      <Field
        id="checkout-line2"
        label="Apartment, suite, etc."
        hint="Optional."
        errors={errors.line2}
        className="sm:col-span-2"
      >
        <Input {...describedBy('checkout-line2', errors.line2, true)} name="line2" maxLength={200} autoComplete="address-line2" />
      </Field>

      <Field id="checkout-city" label="City" required errors={errors.city}>
        <Input {...describedBy('checkout-city', errors.city)} name="city" required maxLength={100} autoComplete="address-level2" />
      </Field>

      <Field id="checkout-state" label="State / region" hint="Optional." errors={errors.state}>
        <Input {...describedBy('checkout-state', errors.state, true)} name="state" maxLength={100} autoComplete="address-level1" />
      </Field>

      <Field id="checkout-postal-code" label="Postal code" required errors={errors.postalCode}>
        <Input
          {...describedBy('checkout-postal-code', errors.postalCode)}
          name="postalCode"
          required
          maxLength={20}
          autoComplete="postal-code"
          autoCapitalize="characters"
        />
      </Field>

      <Field id="checkout-country" label="Country" required errors={errors.country}>
        <Select
          {...describedBy('checkout-country', errors.country)}
          name="country"
          required
          autoComplete="country"
          defaultValue={countries[0]?.code}
        >
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  )
}
