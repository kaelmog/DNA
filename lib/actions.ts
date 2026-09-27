/**
 * Shared shape for Server Action results, used with React's useActionState:
 *
 *   const [state, formAction, pending] = useActionState(myAction, initialActionState)
 *
 * Server actions return `actionSuccess(...)` or `actionError(...)`.
 */
import { z, type ZodError } from 'zod'

export interface ActionState {
  ok?: boolean
  message?: string
  /** Field name -> list of error messages, shown next to inputs. */
  fieldErrors?: Record<string, string[] | undefined>
}

export const initialActionState: ActionState = {}

export function actionSuccess(message: string): ActionState {
  return { ok: true, message }
}

export function actionError(message: string, fieldErrors?: ActionState['fieldErrors']): ActionState {
  return { ok: false, message, fieldErrors }
}

/** Turns a failed zod parse into an ActionState with per-field messages. */
export function actionValidationError(error: ZodError, message = 'Please fix the highlighted fields.'): ActionState {
  return actionError(message, z.flattenError(error).fieldErrors as Record<string, string[]>)
}

export const NOT_CONFIGURED_MESSAGE =
  'The store database is not connected yet. Add your Supabase keys (see the /todo page).'

/** Converts FormData into a plain object for zod. Repeated keys become arrays. */
export function formDataToObject(formData: FormData) {
  const result: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('$ACTION')) continue // internal Next.js fields
    const existing = result[key]
    if (existing === undefined) result[key] = value
    else result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value]
  }
  return result
}
