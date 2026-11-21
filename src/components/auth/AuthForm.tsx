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
    <p role="alert" className="flex items-start gap-2 text-sm font-medium text-red-600 dark:text-red-400">
      <AlertCircle size={17} className="mt-px shrink-0" aria-hidden /> {message}
    </p>
  );
}

export function SubmitButton({ pending, children, disabled }: { pending: boolean; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      disabled={pending || disabled}
      className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-[15px] font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl hover:shadow-violet-500/35 disabled:opacity-70"
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden />
      {pending ? <LoaderCircle size={18} className="animate-spin" aria-hidden /> : null}
      {children}
      {!pending && <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden />}
    </button>
  );
}

const LEVEL_COLORS = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];

export type StrengthText = { hint: string; strength: string; levels: string[] };

const DEFAULT_STRENGTH: StrengthText = {
  hint: "Ən azı 8 simvol; hərf, rəqəm və işarə qarışığı daha güclüdür",
  strength: "Şifrənin gücü",
  levels: ["Çox zəif", "Zəif", "Orta", "Yaxşı", "Güclü"],
};

export function PasswordStrength({ value, t = DEFAULT_STRENGTH }: { value: string; t?: StrengthText }) {
  if (!value) return <span className="mt-1.5 block text-xs text-gray-500">{t.hint}</span>;
  const score =
    (value.length >= 8 ? 1 : 0) +
    (value.length >= 12 ? 1 : 0) +
    (/[a-zəğışçöüа-яё]/.test(value) && /[A-ZƏĞIŞÇÖÜА-ЯЁ]/.test(value) ? 1 : 0) +
    (/\d/.test(value) ? 1 : 0) +
    (/[^A-Za-z0-9əğışçöüƏĞIŞÇÖÜİа-яёА-ЯЁ]/.test(value) ? 1 : 0);
  const level = Math.max(0, Math.min(4, score - 1));
  return (
    <span className="mt-2 block">
      <span className="flex gap-1">
        {LEVEL_COLORS.map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition ${i < score ? LEVEL_COLORS[level] : "bg-gray-200 dark:bg-white/10"}`} />
        ))}
      </span>
      <span className="mt-1 block text-xs text-gray-500">
        {t.strength}: {t.levels[level]}
      </span>
    </span>
  );
}
