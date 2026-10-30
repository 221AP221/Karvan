"use client";

import { AlertCircle, ArrowRight, LoaderCircle } from "lucide-react";
import { startTransition, useActionState } from "react";
import type { AuthState } from "@/app/(auth)/actions";

type Action = (state: AuthState, form: FormData) => Promise<AuthState>;

// Göndərişdən sonra React sahələri sıfırlamasın deyə onSubmit ilə işləyirik (bax: ActionForm)
export function useAuthForm(action: Action) {
  const [state, run, pending] = useActionState(action, undefined);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => run(data));
  };
  return { state, pending, onSubmit };
}

export function AuthError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle size={17} className="mt-px shrink-0" aria-hidden /> {message}
    </p>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      disabled={pending}
      className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-[15px] font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl hover:shadow-violet-500/35 disabled:opacity-70"
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden />
      {pending ? <LoaderCircle size={18} className="animate-spin" aria-hidden /> : null}
      {children}
      {!pending && <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden />}
    </button>
  );
}

const LEVELS = [
  { label: "Çox zəif", color: "bg-red-500" },
  { label: "Zəif", color: "bg-orange-500" },
  { label: "Orta", color: "bg-amber-500" },
  { label: "Yaxşı", color: "bg-lime-500" },
  { label: "Güclü", color: "bg-emerald-500" },
];

export function PasswordStrength({ value }: { value: string }) {
  if (!value) return <span className="mt-1.5 block text-xs text-gray-500">Ən azı 8 simvol; hərf, rəqəm və işarə qarışığı daha güclüdür</span>;
  const score =
    (value.length >= 8 ? 1 : 0) +
    (value.length >= 12 ? 1 : 0) +
    (/[a-zəğışçöü]/.test(value) && /[A-ZƏĞIŞÇÖÜ]/.test(value) ? 1 : 0) +
    (/\d/.test(value) ? 1 : 0) +
    (/[^A-Za-z0-9əğışçöüƏĞIŞÇÖÜİ]/.test(value) ? 1 : 0);
  const level = LEVELS[Math.max(0, Math.min(4, score - 1))];
  return (
    <span className="mt-2 block">
      <span className="flex gap-1">
        {LEVELS.map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition ${i < score ? level.color : "bg-gray-200"}`} />
        ))}
      </span>
      <span className="mt-1 block text-xs text-gray-500">Şifrənin gücü: {level.label}</span>
    </span>
  );
}
