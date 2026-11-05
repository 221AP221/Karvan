import { Bell, Clock, Info } from "lucide-react";
import type { Metadata } from "next";
import { requirePageAccess } from "@/lib/auth";
import { getDictionary, getLocale } from "@/i18n/server";
import { db } from "@/lib/db";
import { channelReady } from "@/lib/notifications";
import { NotifyQueue, NotifySettings } from "./ui";

export const metadata: Metadata = { title: "Bildirişlər" };

export default async function NotificationsPage() {
  const profile = await requirePageAccess("notifications");
  const locale = await getLocale();
  const t = getDictionary(locale).panel.notifications;
  const [queue, recent] = await Promise.all([
    db.notification.findMany({ where: { profileId: profile.id, status: "QUEUED" }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.notification.findMany({ where: { profileId: profile.id, status: { not: "QUEUED" } }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  const ready = { EMAIL: channelReady("EMAIL"), SMS: channelReady("SMS"), PUSH: channelReady("PUSH") };
  // Kanal, hadisə və status adları seçilmiş dildə
  const channelLabel = { EMAIL: t.chEMAIL, SMS: t.chSMS, PUSH: t.chPUSH };
  const eventLabel = { ORDER_NEW: t.evORDER_NEW, PAYMENT_CLAIMED: t.evPAYMENT_CLAIMED, PAYMENT_CONFIRMED: t.evPAYMENT_CONFIRMED, REVIEW_NEW: t.evREVIEW_NEW };
  const statusLabel: Record<string, string> = { QUEUED: t.nsQUEUED, SENT: t.nsSENT, FAILED: t.nsFAILED, SKIPPED: t.nsSKIPPED };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-sm text-gray-500">
          {t.text}
        </p>
      </div>

      <NotifySettings
        mode={profile.notifyMode}
        channels={profile.notifyChannels}
        events={profile.notifyEvents}
        notifyEmail={profile.notifyEmail}
        notifyPhone={profile.notifyPhone}
        accountEmail={profile.user.email ?? ""}
        profilePhone={profile.phone ?? ""}
        ready={ready}
        labels={t}
        channelLabels={channelLabel}
        eventLabels={eventLabel}
      />

      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Clock size={17} className="text-[var(--brand)]" aria-hidden /> {t.queue}
            {queue.length > 0 && <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 text-xs font-medium text-white">{queue.length}</span>}
          </h2>
        </div>
        <NotifyQueue
          labels={t}
          locale={locale}
          items={queue.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            channel: channelLabel[n.channel],
            event: eventLabel[n.event],
            target: n.target,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white">
        <h2 className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 font-semibold">
          <Bell size={17} className="text-gray-400" aria-hidden /> {t.recent}
        </h2>
        {recent.length ? (
          <ul className="divide-y divide-gray-100 text-sm">
            {recent.map((n) => (
              <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{n.title}</span>
                  <span className="block text-xs text-gray-500">
                    {eventLabel[n.event]} · {channelLabel[n.channel]} · {n.target ?? "—"}
                    {n.error ? ` · ${n.error}` : ""}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    n.status === "SENT" ? "bg-emerald-100 text-emerald-800" : n.status === "FAILED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {statusLabel[n.status]}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-gray-500">{t.recentEmpty}</p>
        )}
      </section>

      {!ready.EMAIL && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
          {t.emailWarning}
        </p>
      )}
    </div>
  );
}
