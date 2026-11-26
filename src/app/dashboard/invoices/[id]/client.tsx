"use client";

import { useState } from "react";
import { buttonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { callAi } from "@/lib/ai-client";
import { whatsappShareLink } from "@/lib/notify";
import { Select } from "@/components/Select";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={secondaryButtonClass}
    >
      {copied ? "Kopyalandı ✓" : "Linki kopyala"}
    </button>
  );
}

export function ReminderDraft({ invoiceId, phone }: { invoiceId: string; phone: string | null }) {
  const [tone, setTone] = useState<"friendly" | "neutral" | "firm">("friendly");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<{ busy?: boolean; error?: string }>({});

  async function draft() {
    setState({ busy: true });
    try {
      const res = await callAi<{ message: string }>("reminder", { invoiceId, channel: "WHATSAPP", tone });
      setMessage(res.message);
      setState({});
    } catch (e) {
      setState({ error: (e as Error).message });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Select
        value={tone}
        onChange={(v) => setTone(v as typeof tone)}
        ariaLabel="Üslub"
        options={[
          { value: "friendly", label: "Dostcasına" },
          { value: "neutral", label: "İşgüzar" },
          { value: "firm", label: "Qətiyyətli" },
        ]}
      />
      <button type="button" onClick={draft} disabled={state.busy} className={secondaryButtonClass}>
        {state.busy ? "Yazır..." : "✨ AI ilə mətn yaz"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {message && (
        <>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className={inputClass} />
          {phone && (
            <a href={whatsappShareLink(phone, message)} target="_blank" rel="noopener noreferrer" className={buttonClass}>
              WhatsApp-da göndər
            </a>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Fakturanın silinməsi geri qaytarılmır, ona görə iki addımdan ibarətdir.
 * Ödənilmiş faktura silinəndə əlavə xəbərdarlıq göstərilir (hesabat rəqəmləri dəyişir).
 */
export function DeleteInvoice({ action, number, paid }: { action: () => Promise<void>; number: string; paid: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  if (!confirming)
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full rounded-full px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
      >
        Fakturanı sil
      </button>
    );

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
      <p className="text-sm font-medium text-red-900">{number} silinsin?</p>
      <p className="mt-0.5 text-xs text-red-800">
        Faktura, sətirləri, ödəniş qeydləri və müştəri rəyi həmişəlik silinir; link işləməyəcək.
        {paid ? " Faktura ödənilib — gəlir hesabatlarınızdan da çıxacaq." : ""} Aylıq faktura limiti geri qayıtmır.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <form
          action={async () => {
            setPending(true);
            await action();
          }}
        >
          <button
            disabled={pending}
            className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {pending ? "Silinir..." : "Bəli, sil"}
          </button>
        </form>
        <button type="button" onClick={() => setConfirming(false)} className="px-2 text-xs text-gray-600 hover:underline">
          Ləğv et
        </button>
      </div>
    </div>
  );
}
