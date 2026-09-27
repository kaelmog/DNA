import { adminsSection } from '@/components/todo/sections/admins'
import { authSection } from '@/components/todo/sections/auth'
import { contentSection } from '@/components/todo/sections/content'
import { demoDataSection } from '@/components/todo/sections/demo-data'
import { deploySection } from '@/components/todo/sections/deploy'
import { emailSection } from '@/components/todo/sections/email'
import { environmentSection } from '@/components/todo/sections/environment'
import { afterLaunchSection, testingSection } from '@/components/todo/sections/launch'
import { manualPaymentsSection, stripeSection } from '@/components/todo/sections/payments'
import { securitySection } from '@/components/todo/sections/security'
import { supabaseSection } from '@/components/todo/sections/supabase'
import type { ChecklistContext, ChecklistSection, SectionDefinition } from '@/components/todo/types'

/** Section order is the recommended order of work. Letters follow automatically. */
const SECTION_BUILDERS: Array<(context: ChecklistContext) => SectionDefinition> = [
  supabaseSection,
  environmentSection,
  authSection,
  adminsSection,
  manualPaymentsSection,
  stripeSection,
  emailSection,
  deploySection,
  securitySection,
  demoDataSection,
  contentSection,
  testingSection,
  afterLaunchSection,
]

export function buildChecklistSections(context: ChecklistContext): ChecklistSection[] {
  return SECTION_BUILDERS.map((build, index) => ({ ...build(context), letter: String.fromCharCode(65 + index) }))
}
