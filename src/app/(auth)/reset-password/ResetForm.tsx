"use client";

import { useState } from "react";
import { AuthError, PasswordStrength, SubmitButton, useAuthForm } from "@/components/auth/AuthForm";
import { PasswordField } from "@/components/PasswordField";
import { resetPassword } from "../actions";

export function ResetForm({ token }: { token: string }) {
  const { state, pending, onSubmit } = useAuthForm(resetPassword);
  const [password, setPassword] = useState("");
  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <PasswordField label="Yeni şifrə" name="password" autoComplete="new-password" minLength={8} value={password} onChange={setPassword} hint={<PasswordStrength value={password} />} />
      <PasswordField label="Yeni şifrəni təsdiqləyin" name="confirm" autoComplete="new-password" minLength={8} />
      <AuthError message={state?.error} />
      <SubmitButton pending={pending}>Şifrəni yenilə</SubmitButton>
    </form>
  );
}
