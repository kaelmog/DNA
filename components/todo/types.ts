import type { ReactNode } from 'react'

import type { EnvVarName } from '@/components/todo/env-vars'
import type { Tone } from '@/lib/constants'

/**
 * What the server found out about the setup. Only booleans, counts and the
 * public site URL: secret values never leave the server.
 */
export interface SetupStatus {
  siteUrl: string
  /** The site URL still points at this computer (localhost). */
  siteUrlIsLocal: boolean
  isProduction: boolean
  /** Whether each environment variable has a value. */
  env: Record<EnvVarName, boolean>
  supabaseConfigured: boolean
  supabaseAdminConfigured: boolean
  stripeConfigured: boolean
  /** 'test' for sk_test_ keys, 'live' for sk_live_ keys, null without Stripe. */
  stripeMode: 'test' | 'live' | null
  emailConfigured: boolean
  viewerIsAdmin: boolean
  database: DatabaseStatus
}

/** Live checks against the database. null means "could not check". */
export interface DatabaseStatus {
  schemaInstalled: boolean | null
  starterData: boolean | null
  adminExists: boolean | null
  demoCustomers: number | null
  demoProducts: number | null
}

/** A file from the supabase/ folder, read on the server so it can be copied from the browser. */
export type SqlFile =
  | { name: string; ok: true; content: string; lineCount: number }
  | { name: string; ok: false }

export interface ChecklistStep {
  /** Stable id: the tick is saved in localStorage under it, so never rename it. */
  id: string
  title: string
  content: ReactNode
  /** Confirmed by the server (for example the keys are present), so it starts ticked. */
  verified?: boolean
}

export interface ChecklistSection {
  /** Used for the #anchor and as a prefix for step ids. */
  id: string
  /** A, B, C... assigned from the section order. */
  letter: string
  title: string
  summary: string
  badge?: { label: string; tone: Tone }
  /** Shown above the steps, e.g. a warning. */
  intro?: ReactNode
  steps: ChecklistStep[]
}

export type SectionDefinition = Omit<ChecklistSection, 'letter'>

/** Everything the section builders need to tailor the instructions. */
export interface ChecklistContext {
  status: SetupStatus
  schemaSql: SqlFile
  seedSql: SqlFile
  /** The live site URL when it is set, otherwise https://yourdomain.com as a placeholder. */
  liveUrl: string
}
