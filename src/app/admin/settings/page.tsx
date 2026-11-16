import { Bot } from "lucide-react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { STALE_CLIENT, getAiConfig, getStoredAi, settingsReady, storedAiUnreadable } from "@/lib/ai-settings";
import { PageTitle, card } from "../ui";
import { AiSettingsForm } from "./AiSettingsForm";

export const metadata: Metadata = { title: "Parametrlər" };

export default async function AdminSettings() {
  const admin = await requireAdmin();
  const [stored, active, unreadable] = await Promise.all([getStoredAi(), getAiConfig(), storedAiUnreadable()]);
  return (
    <div>
      <PageTitle title="Parametrlər" text="Sistem ayarları: bir dəfə yazılır, sayt hər dəfə özü işləyir" />
      <section className={`${card} max-w-2xl p-6`}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100">
            <Bot size={20} aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold">AI köməkçi</h2>
            <p className="text-sm text-gray-500">
              {active ? (
                <>Aktiv: <strong className="text-gray-900">{active.kind === "anthropic" ? "Claude" : active.name}</strong>{active.kind === "openai" && <> · {active.model}</>}{stored ? "" : " (.env faylından)"}</>
              ) : (
                "Qoşulmayıb: faktura, təsvir, rəng və xatırlatma düymələri işləmir"
              )}
            </p>
          </div>
        </div>
        {unreadable && (
          <p role="alert" className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Saxlanılmış AI açarı oxunmur: APP_SECRET dəyişib və ya .env faylı yenisi ilə əvəzlənib. Açarı aşağıda bir daha yazın.
          </p>
        )}
        {!settingsReady() ? (
          <p role="alert" className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{STALE_CLIENT}</p>
        ) : admin.role === "SUPER_ADMIN" ? (
          <AiSettingsForm provider={stored?.provider ?? ""} model={stored?.model ?? ""} hasKey={Boolean(stored?.apiKey)} />
        ) : (
          <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">AI ayarını yalnız super admin dəyişə bilər.</p>
        )}
      </section>
    </div>
  );
}
