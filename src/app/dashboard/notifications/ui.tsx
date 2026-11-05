"use client";

import { Send, Trash2 } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import type { NotificationChannel, NotificationEvent, NotifyMode } from "@/generated/prisma/client";
import type { Dict } from "@/i18n/server";
import { dismissNotification, saveNotifySettings, sendAllQueued, sendNotification } from "./actions";

const CHANNELS: NotificationChannel[] = ["EMAIL", "SMS", "PUSH"];
const EVENTS: NotificationEvent[] = ["ORDER_NEW", "PAYMENT_CLAIMED", "PAYMENT_CONFIRMED", "REVIEW_NEW"];
const field = "h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";

export function NotifySettings({
  mode: initialMode,
  channels,
  events,
  notifyEmail,
  notifyPhone,
  accountEmail,
  profilePhone,
  ready,
  labels: t,
  channelLabels,
  eventLabels,
}: {
  mode: NotifyMode;
  channels: NotificationChannel[];
  events: NotificationEvent[];
  notifyEmail: string | null;
  notifyPhone: string | null;
  accountEmail: string;
  profilePhone: string;
  ready: Record<NotificationChannel, boolean>;
  labels: Dict["panel"]["notifications"];
  channelLabels: Record<NotificationChannel, string>;
  eventLabels: Record<NotificationEvent, string>;
}) {
  const [mode, setMode] = useState<NotifyMode>(initialMode);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="font-semibold">{t.settings}</h2>
      <ActionForm action={saveNotifySettings} submitLabel={t.save} successMessage={t.saved}>
        {/* Göndərmə rejimi */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700">{t.mode}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["AUTO", t.auto, t.autoText],
                ["MANUAL", t.manual, t.manualText],
              ] as const
            ).map(([value, title, text]) => (
              <label
                key={value}
                className={`cursor-pointer rounded-xl border p-4 transition ${mode === value ? "border-[var(--brand)] bg-[var(--brand)]/5 ring-2 ring-[var(--brand)]/20" : "border-gray-200 hover:border-gray-400"}`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <input type="radio" name="mode" value={value} checked={mode === value} onChange={() => setMode(value)} className="h-4 w-4 accent-[var(--brand)]" />
                  {title}
                </span>
                <span className="mt-1 block pl-6 text-sm text-gray-500">{text}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Kanallar */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700">{t.channels}</legend>
          <div className="flex flex-wrap gap-4">
            {CHANNELS.map((channel) => (
              <label key={channel} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="channels" value={channel} defaultChecked={channels.includes(channel)} className="h-4 w-4 accent-[var(--brand)]" />
                {channelLabels[channel]}
                {!ready[channel] && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{t.noProvider}</span>}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            {t.channelsHint}
          </p>
        </fieldset>

        {/* Hadisələr */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700">{t.events}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {EVENTS.map((event) => (
              <label key={event} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="events" value={event} defaultChecked={events.includes(event)} className="h-4 w-4 accent-[var(--brand)]" />
                {eventLabels[event]}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Ünvanlar */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{t.notifyEmail}</span>
            <input name="notifyEmail" type="email" defaultValue={notifyEmail ?? ""} placeholder={accountEmail || t.accountEmail} className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{t.notifyPhone}</span>
            <input name="notifyPhone" defaultValue={notifyPhone ?? ""} placeholder={profilePhone || t.profilePhone} className={field} />
          </label>
        </div>
      </ActionForm>
    </section>
  );
}

type QueueItem = { id: string; title: string; body: string; channel: string; event: string; target: string | null; createdAt: string };

export function NotifyQueue({ items, labels: t, locale }: { items: QueueItem[]; labels: Dict["panel"]["notifications"]; locale: string }) {
  const [allState, allAction, allPending] = useActionState(sendAllQueued, undefined);

  if (items.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-gray-500">{t.queueEmpty}</p>;
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <p className="text-sm text-gray-500">{t.queueCount.replace("{n}", String(items.length))}</p>
        <button
          type="button"
          disabled={allPending}
          onClick={() => startTransition(() => allAction())}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          <Send size={15} aria-hidden /> {allPending ? t.sending : t.sendAll}
        </button>
      </div>
      {allState?.error && <p role="alert" className="px-5 pt-2 text-sm text-red-600">{allState.error}</p>}

      <ul className="mt-3 divide-y divide-gray-100">
        {items.map((n) => (
          <li key={n.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{n.title}</p>
              <p className="mt-0.5 whitespace-pre-line text-sm text-gray-600">{n.body}</p>
              <p className="mt-1 text-xs text-gray-400">
                {n.event} · {n.channel} · {n.target ?? t.noTarget} ·{" "}
                {new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(n.createdAt))}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ActionForm action={sendNotification} submitLabel="" className="contents" buttonClassName="hidden">
                <input type="hidden" name="id" value={n.id} />
                <button type="submit" aria-label={t.send} className="rounded-lg p-2 text-[var(--brand)] transition hover:bg-[var(--brand)]/10">
                  <Send size={16} aria-hidden />
                </button>
              </ActionForm>
              <ActionForm action={dismissNotification} submitLabel="" className="contents" buttonClassName="hidden">
                <input type="hidden" name="id" value={n.id} />
                <button type="submit" aria-label={t.dismiss} className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={16} aria-hidden />
                </button>
              </ActionForm>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
