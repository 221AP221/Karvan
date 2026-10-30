"use client";

import { useState } from "react";
import { AuthError, PasswordStrength, SubmitButton, useAuthForm } from "@/components/auth/AuthForm";
import { PasswordField } from "@/components/PasswordField";
import type { Dict } from "@/i18n/server";
import { resetPassword } from "../actions";

export function ResetForm({ token, t, password: pw }: { token: string; t: Dict["auth"]["reset"]; password: Dict["auth"]["password"] }) {
  const { state, pending, onSubmit } = useAuthForm(resetPassword);
  const [password, setPassword] = useState("");
  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <PasswordField label={t.password} name="password" autoComplete="new-password" minLength={8} value={password} onChange={setPassword} labels={pw} hint={<PasswordStrength value={password} t={pw} />} />
      <PasswordField label={t.confirm} name="confirm" autoComplete="new-password" minLength={8} labels={pw} />
      <AuthError message={state?.error} />
      <SubmitButton pending={pending}>{t.submit}</SubmitButton>
    </form>
  );
}
