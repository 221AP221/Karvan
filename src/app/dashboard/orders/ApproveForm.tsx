"use client";

import { ActionForm } from "@/components/ActionForm";
import { inputClass } from "@/components/ui";
import { approveOrder } from "../actions";

export function ApproveForm({ orderId, suggestedAmount }: { orderId: string; suggestedAmount: string }) {
  return (
    <ActionForm action={approveOrder} submitLabel="Təsdiqlə və faktura göndər" className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <input name="amount" inputMode="decimal" required defaultValue={suggestedAmount} placeholder="Qiymət, AZN" className={`${inputClass} !w-32`} />
      <select name="dueDays" defaultValue="3" className={`${inputClass} !w-auto`}>
        <option value="1">1 gün</option>
        <option value="3">3 gün</option>
        <option value="7">7 gün</option>
      </select>
    </ActionForm>
  );
}
