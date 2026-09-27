import { CircleAlert } from 'lucide-react'
import type { Metadata } from 'next'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { countryName } from '@/components/admin/settings/countries'
import { SettingsForm } from '@/components/admin/settings/settings-form'
import { requireAdmin } from '@/lib/auth'
import { getAdminStoreSettings } from '@/lib/data/admin/settings'
import { isStripeConfigured } from '@/lib/env.server'

export const metadata: Metadata = {
  title: 'Settings',
}

export default async function AdminSettingsPage() {
  await requireAdmin()
  const settings = await getAdminStoreSettings()

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Store details, contact information, shipping rules and payments. Changes apply to the whole store as soon as you save."
      />

      {settings ? (
        <div className="max-w-3xl">
          <SettingsForm
            settings={settings}
            stripeConfigured={isStripeConfigured}
            shippingCountryNames={settings.allowed_shipping_countries.map(countryName).join(', ') || 'none'}
          />
        </div>
      ) : (
        <p
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            The store settings could not be loaded. Make sure <code>supabase/schema.sql</code> has been run in your
            Supabase project, then reload this page.
          </span>
        </p>
      )}
    </>
  )
}
