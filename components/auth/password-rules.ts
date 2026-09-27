/**
 * Password rules shared by the client forms (hint text, minLength) and the
 * server-side zod schemas. Kept free of zod so client bundles stay small.
 *
 * Supabase stores passwords with bcrypt, which only reads the first 72 bytes,
 * so Supabase rejects anything longer. Set the same minimum in the Supabase
 * dashboard (Authentication > Providers > Email) so both sides agree.
 */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72

export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters. A short sentence is easy to remember.`
