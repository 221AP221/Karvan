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
