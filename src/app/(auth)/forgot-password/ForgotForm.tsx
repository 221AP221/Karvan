"use client";

import { MailCheck, Mail } from "lucide-react";
import Link from "next/link";
import { AuthField } from "@/components/AuthField";
import { AuthError, SubmitButton, useAuthForm } from "@/components/auth/AuthForm";
import type { Dict } from "@/i18n/server";
import { requestPasswordReset } from "../actions";

export function ForgotForm({ t, email, placeholder }: { t: Dict["auth"]["forgot"]; email: string; placeholder: string }) {
  const { state, pending, onSubmit } = useAuthForm(requestPasswordReset);

  if (state?.ok) {
    return (
      <div className="mt-8">
        <div className="flex flex-col items-center gap-3 border-t border-gray-200 pt-6 text-center dark:border-white/10">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-400/20">
            <MailCheck size={24} strokeWidth={1.75} aria-hidden />
          </span>
          <p className="font-semibold text-gray-900 dark:text-white">{t.sentTitle}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t.sentText}</p>
        </div>
        {state.devLink && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">{t.devTitle}</p>
            <p className="mt-1">{t.devText}</p>
            <Link href={state.devLink.replace(/^https?:\/\/[^/]+/, "")} className="mt-2 block break-all font-medium text-violet-700 underline">
              {t.devButton}
            </Link>
          </div>
        )}
        <p className="mt-8 text-center text-sm text-gray-500">
          <Link href="/login" className="font-semibold text-violet-600 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200">
            {t.back}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <AuthField label={email} name="email" type="email" icon={Mail} required autoComplete="email" placeholder={placeholder} />
        <AuthError message={state?.error} />
        <SubmitButton pending={pending}>{t.submit}</SubmitButton>
      </form>
      <p className="mt-8 text-center text-sm text-gray-500">
        {t.remembered}{" "}
        <Link href="/login" className="font-semibold text-violet-600 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200">
          {t.login}
        </Link>
      </p>
    </>
  );
}
