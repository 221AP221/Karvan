"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { AuthField } from "@/components/AuthField";
import { AuthError, SubmitButton, useAuthForm } from "@/components/auth/AuthForm";
import { PasswordField } from "@/components/PasswordField";
import type { Dict } from "@/i18n/server";
import { login } from "../actions";

export function LoginForm({ t, password }: { t: Dict["auth"]["login"]; password: Dict["auth"]["password"] }) {
  const { state, pending, onSubmit } = useAuthForm(login);
  return (
    <>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <AuthField label={t.email} name="email" type="email" icon={Mail} required autoComplete="email" placeholder={t.emailPlaceholder} />
        <div>
          <PasswordField label={t.password} name="password" labels={password} />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-sm font-medium text-violet-600 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200">
              {t.forgot}
            </Link>
          </div>
        </div>
        <AuthError message={state?.error} />
        <SubmitButton pending={pending}>{t.submit}</SubmitButton>
      </form>
      <p className="mt-8 text-center text-sm text-gray-500">
        {t.noAccount}{" "}
        <Link href="/signup" className="font-semibold text-violet-600 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200">
          {t.signup}
        </Link>
      </p>
    </>
  );
}
