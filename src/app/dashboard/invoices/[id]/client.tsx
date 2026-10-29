"use client";

import { useState } from "react";
import { buttonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { callAi } from "@/lib/ai-client";
import { whatsappShareLink } from "@/lib/notify";

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
      <select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)} className={inputClass}>
        <option value="friendly">Dostcasına</option>
        <option value="neutral">İşgüzar</option>
        <option value="firm">Qətiyyətli</option>
      </select>
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
