"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClaimPaidButton({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function claim() {
    setBusy(true);
    await fetch(`/api/invoices/${publicId}/claim-paid`, { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={claim}
      disabled={busy}
      className="mt-4 w-full rounded-full bg-[var(--brand)] py-2 font-medium text-white disabled:opacity-60"
    >
      Ödədim
    </button>
  );
}

export function CopyValue({ label, value }: { label: string; value: string }) {
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
        {copied ? "Kopyalandı ✓" : "Kopyala"}
      </button>
    </p>
  );
}
