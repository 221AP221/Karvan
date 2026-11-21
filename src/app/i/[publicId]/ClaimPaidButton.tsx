"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Words = { iPaid: string; iPaidConfirm: string; iPaidYes: string; iPaidCancel: string; claimError: string; copy: string; copied: string };

export function ClaimPaidButton({ publicId, words }: { publicId: string; words: Words }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Faktura linki ictimaidir: başqasının yanlışlıqla/zərərlə basması ehtimalını azaltmaq üçün
  // bir addım təsdiq lazımdır — satıcı real ödənişi hər halda bankda yoxlayıb özü təsdiqləyir.
  async function claim() {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/api/invoices/${publicId}/claim-paid`, { method: "POST" });
      if (!res.ok) throw new Error("not ok");
      router.refresh();
    } catch {
      // Pul məsələsində səssiz uğursuzluq olmamalıdır: müştəri bilməlidir ki, bildiriş getmədi
      setError(true);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  if (confirming) {
    return (
      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
        <p className="text-sm text-gray-700">{words.iPaidConfirm}</p>
        <div className="mt-2 flex gap-2">
          <button
            onClick={claim}
            disabled={busy}
            className="flex-1 rounded-full bg-[var(--brand)] py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {words.iPaidYes}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="flex-1 rounded-full border border-gray-300 py-2 text-sm font-medium text-gray-700 disabled:opacity-60"
          >
            {words.iPaidCancel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="mt-4 w-full rounded-full bg-[var(--brand)] py-2 font-medium text-white"
      >
        {words.iPaid}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {words.claimError}
        </p>
      )}
    </>
  );
}

export function CopyValue({ label, value, words }: { label: string; value: string; words: Words }) {
  const [copied, setCopied] = useState(false);
  return (
    <p className="flex items-center justify-between gap-2">
      <span className="font-mono">
        {label}: {value}
      </span>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value.replace(/\s/g, ""));
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="shrink-0 text-xs text-[var(--brand)] hover:underline"
      >
        {copied ? words.copied : words.copy}
      </button>
    </p>
  );
}
