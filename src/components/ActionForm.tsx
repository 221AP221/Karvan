"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { buttonClass } from "@/components/ui";
import type { FormState } from "@/app/dashboard/actions";

// <form action> React 19-da hər göndərişdən sonra sahələri sıfırlayır; xəta olanda
// istifadəçinin yazdıqları itməsin deyə onSubmit ilə göndəririk.
export function ActionForm({
  action,
  submitLabel,
  successMessage,
  resetOnSuccess = false,
  className = "flex flex-col gap-4",
  children,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  submitLabel: string;
  successMessage?: string;
  resetOnSuccess?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      {children}
      {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      {state?.ok && successMessage && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{successMessage}</p>}
      <div>
        <button disabled={pending} className={buttonClass}>
          {pending ? "Gözləyin..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
