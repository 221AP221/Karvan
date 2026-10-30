"use client";

import { ActionForm } from "@/components/ActionForm";
import { inputClass } from "@/components/ui";
import { approveOrder } from "../actions";

export function ApproveForm({ orderId, suggestedAmount, currency }: { orderId: string; suggestedAmount: string; currency: string }) {
  return (
    <ActionForm action={approveOrder} submitLabel="Təsdiqlə və faktura göndər" className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="flex items-center rounded-lg border border-gray-300 bg-white focus-within:border-[var(--brand)]">
        <input name="amount" inputMode="decimal" required defaultValue={suggestedAmount} placeholder="Qiymət" aria-label="Qiymət" className="w-28 rounded-l-lg bg-transparent px-3 py-2 text-sm outline-none" />
        <span className="border-l border-gray-200 px-3 py-2 text-sm font-medium text-gray-500">{currency}</span>
      </div>
      <select name="dueDays" defaultValue="3" aria-label="Ödəniş müddəti" className={`${inputClass} !w-auto`}>
        <option value="1">1 gün</option>
        <option value="3">3 gün</option>
        <option value="7">7 gün</option>
      </select>
    </ActionForm>
  );
}
