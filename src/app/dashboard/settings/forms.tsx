"use client";

import { useActionState, useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { Field, secondaryButtonClass } from "@/components/ui";
import { changeEmail, changePassword, deleteAccount, signOutOtherDevices, updatePaymentSettings } from "./actions";

export function EmailForm({ email }: { email: string }) {
  return (
    <ActionForm action={changeEmail} submitLabel="E-poçtu dəyiş" successMessage="E-poçt dəyişdirildi">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Yeni e-poçt" name="email" type="email" defaultValue={email} required autoComplete="email" />
        <Field label="Təsdiq üçün şifrə" name="password" type="password" required autoComplete="current-password" />
      </div>
    </ActionForm>
  );
}

export function PasswordForm() {
  return (
    <ActionForm action={changePassword} submitLabel="Şifrəni dəyiş" successMessage="Şifrə dəyişdirildi" resetOnSuccess>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Hazırkı şifrə" name="current" type="password" required autoComplete="current-password" />
        <Field label="Yeni şifrə" name="next" type="password" required minLength={8} autoComplete="new-password" />
        <Field label="Yeni şifrə (təkrar)" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
      </div>
    </ActionForm>
  );
}

export function PaymentForm({ values }: { values: Record<"invoicePrefix" | "accountName" | "bankName" | "cardNumber" | "iban", string> }) {
  return (
    <ActionForm action={updatePaymentSettings} submitLabel="Yadda saxla" successMessage="Yadda saxlanıldı">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Faktura prefiksi" name="invoicePrefix" defaultValue={values.invoicePrefix} required hint="Məs. AYG → AYG-2026-0001" />
        <Field label="Alıcının adı" name="accountName" defaultValue={values.accountName} placeholder="Ad Soyad" />
        <Field label="Bank" name="bankName" defaultValue={values.bankName} placeholder="Kapital Bank" />
        <Field label="Kart nömrəsi" name="cardNumber" defaultValue={values.cardNumber} inputMode="numeric" placeholder="0000 0000 0000 0000" />
        <div className="sm:col-span-2">
          <Field label="IBAN" name="iban" defaultValue={values.iban} placeholder="AZ00 XXXX 0000 0000 0000 0000 0000" />
        </div>
      </div>
    </ActionForm>
  );
}

export function SessionsButton({ count }: { count: number }) {
  const [state, action, pending] = useActionState(signOutOtherDevices, undefined);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-gray-600">
        {count === 1 ? "Yalnız bu cihazda daxil olmusunuz." : `${count} cihazda daxil olmusunuz (bu cihaz daxil).`}
      </p>
      {state?.ok ? (
        <span className="text-sm text-green-700">Digər cihazlardan çıxış edildi</span>
      ) : (
        <form action={action}>
          <button disabled={pending || count < 2} className={secondaryButtonClass}>
            Digər cihazlardan çıx
          </button>
        </form>
      )}
    </div>
  );
}

export function DangerZone({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">Səhifəniz, xidmətlər, fakturalar və şəkillər geri qaytarılmadan silinəcək.</p>
        <button type="button" onClick={() => setOpen(true)} className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
          Hesabı sil
        </button>
      </div>
    );
  }
  return (
    <ActionForm action={deleteAccount} submitLabel="Hesabı birdəfəlik sil">
      <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        Bu əməliyyat geri qaytarılmır. Təsdiq üçün istifadəçi adınızı (<b>{username}</b>) və şifrənizi yazın.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="İstifadəçi adı" name="confirmUsername" required autoComplete="off" />
        <Field label="Şifrə" name="password" type="password" required autoComplete="current-password" />
      </div>
    </ActionForm>
  );
}
