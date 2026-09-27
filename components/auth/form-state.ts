import type { ActionState } from '@/lib/actions'

/**
 * ActionState plus the submitted, non-secret values. React resets a form after
 * its action finishes, so forms use these as `defaultValue` to refill inputs
 * when the server sends back an error. Passwords are never echoed back.
 */
export type FormState<Values> = ActionState & { values?: Partial<Values> }
