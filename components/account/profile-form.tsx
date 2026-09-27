"use client";

import { useActionState } from "react";

import {
  updateProfile,
  type ProfileFormState,
} from "@/app/(shop)/account/actions";
import { TextField } from "@/components/auth/text-field";
import { FormMessage, SubmitButton } from "@/components/ui/form-status";
import { Checkbox } from "@/components/ui/input";
import { initialActionState } from "@/lib/actions";

interface ProfileValues {
  full_name: string | null;
  phone: string | null;
  marketing_opt_in: boolean;
}

/** Name, phone and email preferences: the profile fields customers may edit themselves. */
export function ProfileForm({ profile }: { profile: ProfileValues }) {
  const [state, formAction] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    initialActionState
  );
  // After a submit, show what was sent (or saved) rather than the values the page first loaded with.
  const values = {
    full_name: state.values?.full_name ?? profile.full_name ?? "",
    phone: state.values?.phone ?? profile.phone ?? "",
    marketing_opt_in:
      state.values?.marketing_opt_in ?? profile.marketing_opt_in,
  };

  return (
    <form action={formAction} className="grid gap-5">
      <TextField
        id="profile-name"
        name="full_name"
        label="Full name"
        autoComplete="name"
        maxLength={120}
        defaultValue={values.full_name}
        errors={state.fieldErrors?.full_name}
      />
      <TextField
        id="profile-phone"
        name="phone"
        type="tel"
        label="Phone"
        autoComplete="tel"
        inputMode="tel"
        maxLength={40}
        hint="Optional. Only used if we need to reach you about an order."
        defaultValue={values.phone}
        errors={state.fieldErrors?.phone}
      />
      <label
        htmlFor="profile-marketing"
        className="flex min-h-10 cursor-pointer items-start gap-3 text-sm leading-6"
      >
        <Checkbox
          id="profile-marketing"
          name="marketing_opt_in"
          defaultChecked={values.marketing_opt_in}
          className="mt-1"
        />
        <span>Email me about new pieces, restocks and studio news.</span>
      </label>
      <FormMessage state={state} />
      <SubmitButton className="w-full sm:w-auto sm:justify-self-start">
        Save details
      </SubmitButton>
    </form>
  );
}
