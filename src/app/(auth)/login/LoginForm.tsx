"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { AuthField } from "@/components/AuthField";
import { AuthError, SubmitButton, useAuthForm } from "@/components/auth/AuthForm";
import { PasswordField } from "@/components/PasswordField";
import { login } from "../actions";

export function LoginForm() {
  const { state, pending, onSubmit } = useAuthForm(login);
  return (
    <>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <AuthField label="E-poçt" name="email" type="email" icon={Mail} required autoComplete="email" placeholder="ad@nümunə.az" />
        <div>
          <PasswordField label="Şifrə" name="password" />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-sm font-medium text-violet-600 hover:text-violet-800">
              Şifrəmi unutdum?
            </Link>
          </div>
        </div>
        <AuthError message={state?.error} />
        <SubmitButton pending={pending}>Daxil ol</SubmitButton>
      </form>
      <p className="mt-8 text-center text-sm text-gray-500">
        Hesabınız yoxdur?{" "}
        <Link href="/signup" className="font-semibold text-violet-600 hover:text-violet-800">
          Pulsuz qeydiyyat
        </Link>
      </p>
    </>
  );
}
