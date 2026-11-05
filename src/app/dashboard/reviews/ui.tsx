"use client";

import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import type { Dict } from "@/i18n/server";
import { replyToReview } from "./actions";

export function ReplyForm({ id, reply, t }: { id: string; reply: string | null; t: Dict["panel"]["reviews"] }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="mt-3">
        {reply && (
          <div className="rounded-xl bg-gray-50 p-3 text-sm">
            <p className="font-medium text-gray-700">{t.yourReply}</p>
            <p className="mt-1 whitespace-pre-line text-gray-600">{reply}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 text-sm font-medium text-[var(--brand)] hover:underline"
        >
          {reply ? t.editReply : t.writeReply}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <ActionForm action={replyToReview} submitLabel={t.saveReply} successMessage={t.replySaved}>
        <input type="hidden" name="id" value={id} />
        <textarea
          name="reply"
          defaultValue={reply ?? ""}
          rows={3}
          maxLength={600}
          placeholder={t.replyPlaceholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15"
        />
      </ActionForm>
      <button type="button" onClick={() => setOpen(false)} className="mt-2 text-sm text-gray-500 hover:underline">
        {t.close}
      </button>
    </div>
  );
}
