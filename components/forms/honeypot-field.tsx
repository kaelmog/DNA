/**
 * Hidden anti-spam field. People never see or fill it; many bots fill every
 * input they find. The server treats a filled "website" field as spam and
 * quietly pretends the submission worked.
 */
export function HoneypotField({ idPrefix }: { idPrefix: string }) {
  const id = `${idPrefix}-website`
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
      <label htmlFor={id}>Leave this field empty</label>
      <input id={id} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    </div>
  )
}
