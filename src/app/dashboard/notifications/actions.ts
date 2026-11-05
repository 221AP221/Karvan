"use server";

import { revalidatePath } from "next/cache";
import type { NotificationChannel, NotificationEvent, NotifyMode } from "@/generated/prisma/client";
import { logActivity } from "@/lib/activity";
import { requirePermission, requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/forms";
import { deliver } from "@/lib/notifications";

const CHANNELS: NotificationChannel[] = ["EMAIL", "SMS", "PUSH"];
const EVENTS: NotificationEvent[] = ["ORDER_NEW", "PAYMENT_CLAIMED", "PAYMENT_CONFIRMED", "REVIEW_NEW"];

export async function saveNotifySettings(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requirePermission("notifications");
  const mode = (String(form.get("mode")) === "MANUAL" ? "MANUAL" : "AUTO") as NotifyMode;
  const channels = form.getAll("channels").map(String).filter((c): c is NotificationChannel => CHANNELS.includes(c as NotificationChannel));
  const events = form.getAll("events").map(String).filter((e): e is NotificationEvent => EVENTS.includes(e as NotificationEvent));
  const email = String(form.get("notifyEmail") ?? "").trim();
  const phone = String(form.get("notifyPhone") ?? "").trim();

  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "E-poçt düzgün deyil" };

  await db.profile.update({
    where: { id: profile.id },
    data: {
      notifyMode: mode,
      notifyChannels: channels,
      notifyEvents: events,
      notifyEmail: email || null,
      notifyPhone: phone || null,
    },
  });
  await logActivity({
    userId: profile.userId,
    email: profile.user.email,
    profileId: profile.id,
    actor: profile.actor,
    action: "notify_settings",
    details: `${mode} · ${channels.join(",") || "kanal yoxdur"}`,
  });
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

/** Növbədəki bildirişi əl ilə göndərir. */
export async function sendNotification(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requirePermission("notifications");
  const id = String(form.get("id") ?? "");
  const owned = await db.notification.findFirst({ where: { id, profileId: profile.id }, select: { id: true } });
  if (!owned) return { error: "Bildiriş tapılmadı" };

  const result = await deliver(owned.id);
  await logActivity({ userId: profile.userId, email: profile.user.email, profileId: profile.id, actor: profile.actor, action: "notify_sent", details: id });
  revalidatePath("/dashboard/notifications");
  return result.ok ? { ok: true } : { error: result.reason };
}

/** Növbədəki bütün bildirişləri göndərir. */
export async function sendAllQueued(): Promise<FormState> {
  const profile = await requirePermission("notifications");
  const queued = await db.notification.findMany({
    where: { profileId: profile.id, status: "QUEUED" },
    select: { id: true },
    take: 50,
  });
  let sent = 0;
  for (const n of queued) {
    const result = await deliver(n.id);
    if (result.ok) sent++;
  }
  revalidatePath("/dashboard/notifications");
  if (queued.length === 0) return { error: "Növbədə bildiriş yoxdur" };
  return sent > 0 ? { ok: true } : { error: "Heç biri göndərilmədi — kanal provayderi qoşulmayıb" };
}

/** Növbədəki bildirişi siyahıdan çıxarır. */
export async function dismissNotification(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requirePermission("notifications");
  const id = String(form.get("id") ?? "");
  await db.notification.deleteMany({ where: { id, profileId: profile.id } });
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}
