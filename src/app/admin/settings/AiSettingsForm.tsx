"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { inputClass } from "@/components/ui";
import { saveAiSettings, testAi } from "../actions";

const PROVIDERS = [
  { id: "groq", label: "Groq: pulsuz, sürətli (tövsiyə)", url: "https://console.groq.com/keys", model: "llama-3.3-70b-versatile" },
  { id: "gemini", label: "Google Gemini: pulsuz", url: "https://aistudio.google.com/apikey", model: "gemini-2.5-flash" },
  { id: "openrouter", label: "OpenRouter: pulsuz modellər", url: "https://openrouter.ai/keys", model: "meta-llama/llama-3.3-70b-instruct:free" },
  { id: "ollama", label: "Ollama: öz kompüterinizdə, açar yoxdur", url: "https://ollama.com", model: "llama3.1" },
  { id: "anthropic", label: "Claude: ödənişli, ən güclü", url: "https://console.anthropic.com", model: "" },
];

export function AiSettingsForm({ provider: initial, model: initialModel, hasKey }: { provider: string; model: string; hasKey: boolean }) {
  const [state, action, pending] = useActionState(saveAiSettings, undefined);
  const [provider, setProvider] = useState(initial || "groq");
  const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, startTest] = useTransition();
  const current = PROVIDERS.find((p) => p.id === provider)!;

  return (
    <form action={action} className="mt-5 flex flex-col gap-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">Təminatçı</span>
        <select name="provider" value={provider} onChange={(e) => setProvider(e.target.value)} className={inputClass}>
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
          <option value="off">Söndür (yalnız .env istifadə olunsun)</option>
        </select>
      </label>
      {provider !== "off" && provider !== "ollama" && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">API açarı</span>
          <input name="apiKey" type="password" autoComplete="off" placeholder={hasKey && initial === provider ? "•••••••• (saxlanılıb, dəyişmək üçün yeni açar yazın)" : "Açarı yapışdırın"} className={`${inputClass} font-mono`} />
          <span className="mt-1 block text-xs text-gray-500">
            Açarı buradan pulsuz alın: <a href={current.url} target="_blank" rel="noopener noreferrer" className="underline">{current.url}</a>. Bazada şifrələnmiş saxlanılır.
          </span>
        </label>
      )}
      {provider !== "off" && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Model <span className="font-normal text-gray-400">(könüllü)</span></span>
          <input name="model" defaultValue={initialModel} key={provider} placeholder={current.model || "defolt"} className={`${inputClass} font-mono`} />
          <span className="mt-1 block text-xs text-gray-500">Boş qalsa, defolt model işləyir. Pulsuz modellərin adları tez-tez dəyişir: ad köhnəlibsə, təminatçının cari siyahısından yazın.</span>
        </label>
      )}
      {state?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Saxlanıldı. Sayt bundan sonra AI-ı özü işlədəcək, yenidən başlatmaq lazım deyil.</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button disabled={pending} className="rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-60">{pending ? "Saxlanılır..." : "Saxla"}</button>
        <button type="button" disabled={testing} onClick={() => startTest(async () => setTest(await testAi()))} className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-5 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60">
          {testing && <LoaderCircle size={14} className="animate-spin" aria-hidden />} AI-ı yoxla
        </button>
      </div>
      {test && <p role="status" className={`rounded-lg p-3 text-sm ${test.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{test.message}</p>}
    </form>
  );
}
