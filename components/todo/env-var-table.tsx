import { Badge } from '@/components/ui/badge'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import {
  ENV_VARS,
  REQUIREMENT_LABEL,
  VISIBILITY_LABEL,
  type EnvVarRequirement,
  type EnvVarVisibility,
} from '@/components/todo/env-vars'
import type { Tone } from '@/lib/constants'

const visibilityTone: Record<EnvVarVisibility, Tone> = { public: 'info', secret: 'danger', server: 'neutral' }
const requirementTone: Record<EnvVarRequirement, Tone> = { required: 'warning', recommended: 'info', optional: 'neutral' }

function EnvVarBadges({ visibility, requirement }: { visibility: EnvVarVisibility; requirement: EnvVarRequirement }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge tone={visibilityTone[visibility]}>{VISIBILITY_LABEL[visibility]}</Badge>
      <Badge tone={requirementTone[requirement]}>{REQUIREMENT_LABEL[requirement]}</Badge>
    </div>
  )
}

/**
 * Every variable from .env.example with what it does and where to find it.
 * Stacked cards on phones and tablets, a table on large screens.
 */
export function EnvVarTable() {
  return (
    <>
      <ul className="grid grid-cols-1 gap-3 lg:hidden">
        {ENV_VARS.map((info) => (
          <li key={info.name} className="rounded-xl border border-border bg-background p-4">
            <p className="font-mono text-[13px] font-semibold break-all text-foreground">{info.name}</p>
            <div className="mt-2">
              <EnvVarBadges visibility={info.visibility} requirement={info.requirement} />
            </div>
            <p className="mt-2 text-sm leading-6">{info.purpose}</p>
            <p className="mt-1 text-sm leading-6">
              <span className="font-medium text-foreground">Where: </span>
              {info.whereToFind}
            </p>
          </li>
        ))}
      </ul>

      <div className="hidden lg:block">
        <Table className="min-w-0 text-[13px] leading-5">
          <THead>
            <tr>
              <TH className="w-[38%]">Variable</TH>
              <TH>What it does</TH>
              <TH>Where to find it</TH>
            </tr>
          </THead>
          <TBody>
            {ENV_VARS.map((info) => (
              <TR key={info.name} className="align-top">
                <TD className="align-top">
                  <p className="font-mono font-semibold break-all text-foreground">{info.name}</p>
                  <div className="mt-2">
                    <EnvVarBadges visibility={info.visibility} requirement={info.requirement} />
                  </div>
                </TD>
                <TD className="align-top text-muted-foreground">{info.purpose}</TD>
                <TD className="align-top text-muted-foreground">{info.whereToFind}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  )
}
