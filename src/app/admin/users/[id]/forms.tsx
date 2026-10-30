"use client";

import { ActionForm } from "@/components/ActionForm";
import { inputClass } from "@/components/ui";

const danger = "inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60";
const dark = "inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-60";
import { blockUser, deleteUser, setPlan } from "../../actions";

export function PlanForm({ userId, plan }: { userId: string; plan: string }) {
  return (
    <ActionForm action={setPlan} submitLabel="Planı dəyiş" successMessage="Plan dəyişdirildi" className="flex flex-col gap-3" buttonClassName={dark}>
      <input type="hidden" name="userId" value={userId} />
      <select name="plan" defaultValue={plan} className={inputClass} aria-label="Plan">
        <option value="FREE">Pulsuz</option>
        <option value="PRO">Pro · 9,99 AZN</option>
        <option value="PRO_MAX">Pro Max · 29,99 AZN</option>
      </select>
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
