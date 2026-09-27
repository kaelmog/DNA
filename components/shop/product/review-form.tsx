'use client'

import { Star } from 'lucide-react'
import { useActionState, useState } from 'react'

import { Field } from '@/components/ui/field'
import { FormMessage, SubmitButton } from '@/components/ui/form-status'
import { Input, Textarea } from '@/components/ui/input'
import { initialActionState, type ActionState } from '@/lib/actions'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  /** submitReview with the product id and slug already bound. */
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  /** Pre-fills the display name, usually the profile's full name. */
  defaultName: string
}

/**
 * Review form. Inputs are controlled so the visitor's text survives a failed
 * submission (React resets uncontrolled fields after every form action).
 */
export function ReviewForm({ action, defaultName }: ReviewFormProps) {
  const [state, formAction] = useActionState(action, initialActionState)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [authorName, setAuthorName] = useState(defaultName)
  const errors = state.fieldErrors ?? {}

  // The page re-renders with the "awaiting moderation" note; this covers the moment in between.
  if (state.ok) return <FormMessage state={state} />

  return (
    <form action={formAction} className="grid gap-5">
      <RatingInput value={rating} onChange={setRating} errors={errors.rating} />

      <Field id="review-title" label="Title" hint="Optional, up to 120 characters." errors={errors.title}>
        <Input
          id="review-title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          aria-invalid={Boolean(errors.title?.length)}
          aria-describedby="review-title-description"
        />
      </Field>

      <Field id="review-body" label="Your review" required hint="At least 10 characters." errors={errors.body}>
        <Textarea
          id="review-body"
          name="body"
          rows={5}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          required
          minLength={10}
          maxLength={4000}
          placeholder="How does it look in your space? How is the quality?"
          aria-invalid={Boolean(errors.body?.length)}
          aria-describedby="review-body-description"
        />
      </Field>

      <Field id="review-name" label="Display name" required hint="Shown next to your review." errors={errors.author_name}>
        <Input
          id="review-name"
          name="author_name"
          value={authorName}
          onChange={(event) => setAuthorName(event.target.value)}
          required
          maxLength={80}
          autoComplete="name"
          aria-invalid={Boolean(errors.author_name?.length)}
          aria-describedby="review-name-description"
        />
      </Field>

      <FormMessage state={state} />
      <SubmitButton pendingText="Sending…" className="justify-self-start">
        Submit review
      </SubmitButton>
    </form>
  )
}

interface RatingInputProps {
  value: number
  onChange: (rating: number) => void
  errors?: string[]
}

/** Five radio buttons drawn as stars. Hovering previews a rating; keyboard users use the arrow keys. */
function RatingInput({ value, onChange, errors }: RatingInputProps) {
  const [hovered, setHovered] = useState(0)
  const shown = hovered || value
  const hasError = Boolean(errors?.length)

  return (
    <fieldset aria-describedby={hasError ? 'review-rating-error' : undefined}>
      <legend className="text-sm font-medium">
        Your rating
        <span className="text-clay" aria-hidden="true">
          {' '}
          *
        </span>
      </legend>
      <div className="mt-1.5 flex" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <label
            key={star}
            onMouseEnter={() => setHovered(star)}
            className="cursor-pointer rounded-lg p-1.5 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40"
          >
            <input
              type="radio"
              name="rating"
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              required
              className="sr-only"
            />
            <Star
              className={cn('size-7 transition-colors', star <= shown ? 'fill-clay-light text-clay-light' : 'text-oat')}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span className="sr-only">
              {star} {star === 1 ? 'star' : 'stars'}
            </span>
          </label>
        ))}
      </div>
      {hasError && (
        <p id="review-rating-error" className="mt-1 text-xs text-destructive">
          {errors?.join(' ')}
        </p>
      )}
    </fieldset>
  )
}
