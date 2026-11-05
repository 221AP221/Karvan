"use client";

import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { replyToReview } from "./actions";

export function ReplyForm({ id, reply }: { id: string; reply: string | null }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="mt-3">
        {reply && (
          <div className="rounded-xl bg-gray-50 p-3 text-sm">
            <p className="font-medium text-gray-700">Cavabınız</p>
            <p className="mt-1 whitespace-pre-line text-gray-600">{reply}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 text-sm font-medium text-[var(--brand)] hover:underline"
        >
          {reply ? "Cavabı dəyiş" : "Cavab yaz"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <ActionForm action={replyToReview} submitLabel="Cavabı yadda saxla" successMessage="Cavab yadda saxlanıldı">
        <input type="hidden" name="id" value={id} />
        <textarea
          name="reply"
          defaultValue={reply ?? ""}
          rows={3}
          maxLength={600}
          placeholder="Müştəriyə cavabınız (səhifənizdə rəyin altında görünür)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15"
        />
      </ActionForm>
      <button type="button" onClick={() => setOpen(false)} className="mt-2 text-sm text-gray-500 hover:underline">
        Bağla
      </button>
    </div>
  );
}
