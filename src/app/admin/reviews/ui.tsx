"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { toggleReviewVisibility } from "../actions";

export function ModerateReview({ id, hidden }: { id: string; hidden: boolean }) {
  const [open, setOpen] = useState(false);

  if (hidden) {
    return (
      <div className="mt-3">
        <ActionForm action={toggleReviewVisibility} submitLabel="" className="contents" buttonClassName="hidden">
          <input type="hidden" name="id" value={id} />
          <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3.5 py-1.5 text-sm font-medium transition hover:border-gray-500">
            <Eye size={15} aria-hidden /> Bərpa et
          </button>
        </ActionForm>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-600 transition hover:border-red-400 hover:text-red-600">
        <EyeOff size={15} aria-hidden /> Gizlət
      </button>
    );
  }

  return (
    <div className="mt-3 max-w-md">
      <ActionForm action={toggleReviewVisibility} submitLabel="Gizlət" successMessage="Rəy gizlədildi">
        <input type="hidden" name="id" value={id} />
        <input
          name="reason"
          placeholder="Səbəb (saxta rəy, təhqir, reklam...)"
          maxLength={200}
          className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[var(--brand)]"
        />
      </ActionForm>
      <button type="button" onClick={() => setOpen(false)} className="mt-2 text-sm text-gray-500 hover:underline">
        Ləğv et
      </button>
    </div>
  );
}
