import 'server-only'

import { ACCEPTED_IMAGE_TYPES, MAX_REFERENCE_IMAGE_BYTES } from '@/lib/constants'

type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number]

/**
 * File signatures ("magic bytes"). The browser-reported type is only a claim,
 * so the first bytes of the file must match it too.
 */
const IMAGE_FORMATS: Record<AcceptedImageType, { extension: string; matches: (bytes: Uint8Array) => boolean }> = {
  'image/jpeg': {
    extension: 'jpg',
    matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  'image/png': {
    extension: 'png',
    matches: (bytes) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47,
  },
  'image/webp': {
    extension: 'webp',
    // "RIFF" <4-byte size> "WEBP"
    matches: (bytes) => ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP',
  },
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.subarray(start, end))
}

function isAcceptedType(type: string): type is AcceptedImageType {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type)
}

export type ReferenceImageResult =
  | { ok: true; bytes: Uint8Array; contentType: AcceptedImageType; extension: string }
  | { ok: false; message: string }

/** True when the form really contained a file (an empty file input sends a 0-byte File). */
export function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0
}

/** Checks type, size and file signature, and returns the bytes ready to upload. */
export async function readReferenceImage(file: File): Promise<ReferenceImageResult> {
  if (!isAcceptedType(file.type)) {
    return { ok: false, message: 'Please upload a JPG, PNG or WebP image.' }
  }
  if (file.size > MAX_REFERENCE_IMAGE_BYTES) {
    return { ok: false, message: `The image must be ${MAX_REFERENCE_IMAGE_BYTES / (1024 * 1024)} MB or smaller.` }
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const format = IMAGE_FORMATS[file.type]
  if (!format.matches(bytes)) {
    return { ok: false, message: 'That file does not look like a valid image. Please try another one.' }
  }

  return { ok: true, bytes, contentType: file.type, extension: format.extension }
}
