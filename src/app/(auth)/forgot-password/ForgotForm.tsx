"use client";

import { MailCheck, Mail } from "lucide-react";
import Link from "next/link";
import { AuthField } from "@/components/AuthField";
import { AuthError, SubmitButton, useAuthForm } from "@/components/auth/AuthForm";
import { requestPasswordReset } from "../actions";

export function ForgotForm() {
  const { state, pending, onSubmit } = useAuthForm(requestPasswordReset);

  if (state?.ok) {
    return (
      <div className="mt-8">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-600 ring-1 ring-emerald-200">
            <MailCheck size={24} strokeWidth={1.75} aria-hidden />
          </span>
          <p className="font-semibold text-emerald-900">E-poçtunuzu yoxlayın</p>
          <p className="text-sm text-emerald-800">Bu e-poçt ilə hesab varsa, şifrəni yeniləmək üçün link göndərdik. Link 30 dəqiqə etibarlıdır.</p>
        </div>
        {state.devLink && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Lokal rejim: e-poçt xidməti qoşulmayıb</p>
            <p className="mt-1">Məktub əvəzinə link burada göstərilir (yalnız öz kompüterinizdə):</p>
            <Link href={state.devLink.replace(/^https?:\/\/[^/]+/, "")} className="mt-2 block break-all font-medium text-violet-700 underline">
              Şifrəni yenilə
            </Link>
          </div>
        )}
        <p className="mt-8 text-center text-sm text-gray-500">
          <Link href="/login" className="font-semibold text-violet-600 hover:text-violet-800">
            Girişə qayıt
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <AuthField label="E-poçt" name="email" type="email" icon={Mail} required autoComplete="email" placeholder="ad@nümunə.az" />
        <AuthError message={state?.error} />
        <SubmitButton pending={pending}>Link göndər</SubmitButton>
      </form>
      <p className="mt-8 text-center text-sm text-gray-500">
        Şifrəni xatırladınız?{" "}
        <Link href="/login" className="font-semibold text-violet-600 hover:text-violet-800">
          Daxil olun
        </Link>
      </p>
    </>
  );
}
