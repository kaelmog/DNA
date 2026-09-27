'use client'

import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import type { ActionState } from '@/lib/actions'

interface ProductSaveBarProps {
  state: ActionState
  isNew: boolean
  /** True while the action runs (passed explicitly because `disabled` overrides SubmitButton's own pending check). */
  pending: boolean
  /** Photos still uploading: saving now would leave them out. */
  uploading: boolean
}

/**
 * Save button and result message, pinned to the bottom of the screen so they
 * stay in reach on a long form: full width on phones, a floating bar from sm up.
 * Must be rendered inside the product <form>.
 */
export function ProductSaveBar({ state, isNew, pending, uploading }: ProductSaveBarProps) {
  const hint = uploading
    ? 'Waiting for photos to finish uploading…'
    : isNew
      ? 'New products start as drafts unless you choose Active.'
      : 'Nothing changes in the shop until you save.'

  return (
    <div
      data-save-bar
      className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:bottom-4 sm:mx-0 sm:rounded-2xl sm:border sm:bg-card/95 sm:px-5 sm:pb-3 sm:shadow-lg"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 sm:flex-1">
          {state.message ? (
            <FormMessage state={state} className="py-2" />
          ) : (
            <p className={uploading ? 'text-sm text-muted-foreground' : 'hidden text-sm text-muted-foreground sm:block'}>
              {hint}
            </p>
          )}
        </div>
        <SubmitButton
          disabled={pending || uploading}
          pendingText={isNew ? 'Creating…' : 'Saving…'}
          className="w-full sm:w-auto"
        >
          {isNew ? 'Create product' : 'Save changes'}
        </SubmitButton>
      </div>
    </div>
  )
}
