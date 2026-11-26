"use client";

import { PhoneInput } from "@/components/PhoneInput";
import { useActionState, useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { inputClass } from "@/components/ui";

const danger = "inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60";
const dark = "inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-60";
import { blockUser, deleteUser, setPlan, setUserPassword, updateUser } from "../../actions";
import { SelectInput } from "@/components/Select";

export function PlanForm({ userId, plan }: { userId: string; plan: string }) {
  return (
    <ActionForm action={setPlan} submitLabel="Planı dəyiş" successMessage="Plan dəyişdirildi" className="flex flex-col gap-3" buttonClassName={dark}>
      <input type="hidden" name="userId" value={userId} />
      <SelectInput
        name="plan"
        defaultValue={plan}
        ariaLabel="Plan"
        options={[
          { value: "FREE", label: "Pulsuz" },
          { value: "PRO", label: "Pro · 9,99 AZN" },
          { value: "PRO_MAX", label: "Pro Max · 29,99 AZN" },
        ]}
      />
    </ActionForm>
  );
}

export function BlockForm({ userId }: { userId: string }) {
  return (
    <ActionForm action={blockUser} submitLabel="Hesabı blokla" className="flex flex-col gap-3" buttonClassName={danger}>
      <input type="hidden" name="userId" value={userId} />
      <textarea name="reason" required minLength={3} maxLength={300} rows={2} placeholder="Səbəb (məs. saxta elanlar, şikayətlər)" className={inputClass} />
      <p className="text-xs text-gray-500">Hesab dərhal çıxış edir, səhifəsi və xidmətləri gizlənir. Sonradan bərpa etmək olar.</p>
    </ActionForm>
  );
}

export function DeleteForm({ userId, email }: { userId: string; email: string }) {
  return (
    <ActionForm action={deleteUser} submitLabel="Birdəfəlik sil" className="flex flex-col gap-3" buttonClassName={danger}>
      <input type="hidden" name="userId" value={userId} />
      <input name="confirm" required placeholder={email} autoComplete="off" className={inputClass} aria-label="Təsdiq üçün e-poçt" />
      <p className="text-xs text-gray-500">Profil, xidmətlər, sifarişlər və fakturalar silinir. Geri qaytarmaq olmur. Təsdiq üçün e-poçtu yazın.</p>
    </ActionForm>
  );
}

type EditValues = Record<"firstName" | "lastName" | "email" | "phone" | "username" | "displayName" | "profession" | "city", string>;

export function EditForm({ userId, values, hasProfile }: { userId: string; values: EditValues; hasProfile: boolean }) {
  const field = (name: keyof EditValues, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <input name={name} defaultValue={values[name]} className={inputClass} {...props} />
    </label>
  );
  return (
    <ActionForm action={updateUser} submitLabel="Yadda saxla" successMessage="Məlumatlar yeniləndi" className="flex flex-col gap-3" buttonClassName={dark}>
      <input type="hidden" name="userId" value={userId} />
      <div className="grid gap-3 sm:grid-cols-2">
        {field("firstName", "Ad")}
        {field("lastName", "Soyad")}
        {field("email", "E-poçt", { type: "email", required: true })}
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">Telefon</span>
          <PhoneInput name="phone" defaultValue={values.phone} />
        </label>
        {hasProfile && field("username", "Səhifə ünvanı", { required: true, pattern: "^[a-z0-9_.]{3,30}$" })}
        {hasProfile && field("displayName", "Səhifədə görünən ad", { required: true })}
        {hasProfile && field("profession", "Peşə")}
        {hasProfile && field("city", "Şəhər")}
      </div>
      <p className="text-xs text-gray-500">Dəyişikliklər jurnalda köhnə və yeni dəyərlə qeyd olunur.</p>
    </ActionForm>
  );
}

export function PasswordAdminForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(setUserPassword, undefined);
  const [copied, setCopied] = useState(false);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="userId" value={userId} />
      <input name="password" type="text" minLength={8} autoComplete="off" placeholder="Yeni şifrə (ən azı 8 simvol)" className={inputClass} aria-label="Yeni şifrə" />
      <div className="flex flex-wrap gap-2">
        <button disabled={pending} className={dark}>Şifrəni təyin et</button>
        <button disabled={pending} name="generate" value="1" formNoValidate className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
          Müvəqqəti şifrə yarat
        </button>
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      {state?.ok && !state.temp && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Şifrə dəyişdirildi, istifadəçi bütün cihazlardan çıxarıldı.</p>}
      {state?.temp && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">Müvəqqəti şifrə (yalnız indi görünür):</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="rounded bg-white px-2 py-1 tabular-nums text-base">{state.temp}</code>
            <button type="button" onClick={() => { navigator.clipboard.writeText(state.temp!); setCopied(true); }} className="text-xs font-medium underline">
              {copied ? "Kopyalandı" : "Kopyala"}
            </button>
          </div>
          <p className="mt-2 text-xs">İstifadəçiyə təhlükəsiz kanalla çatdırın və girişdən sonra Parametrlərdə dəyişməsini xahiş edin.</p>
        </div>
      )}
      <p className="text-xs text-gray-500">Şifrələr şifrələnmiş (hash) saxlanılır: köhnə şifrəni heç kim, admin də görə bilməz. Ona görə yalnız yenisi təyin edilir.</p>
    </form>
  );
}
