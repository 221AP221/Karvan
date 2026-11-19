"use client";

import { UserMinus } from "lucide-react";
import { useState, useTransition } from "react";
import { removeMembership } from "../actions";

/** Mübahisə/sui-istifadə halında admin üzvü komandadan çıxara bilir — iki klikli təsdiqlə. */
export function RemoveMemberButton({ id, label }: { id: string; label: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => { await removeMembership(id); setConfirming(false); })}
          className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? "Çıxarılır…" : "Təsdiq"}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="px-1 text-xs text-gray-500 hover:text-gray-800">
          Ləğv et
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`${label} komandadan çıxar`}
      title="Komandadan çıxar"
      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
    >
      <UserMinus size={15} aria-hidden />
    </button>
  );
}
