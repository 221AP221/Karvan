import type { NotificationChannel, NotificationEvent, NotifyMode } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/notify";

/**
 * Bildiriş mühərriki (FR-BLD-03).
 *
 * Hadisə baş verəndə satıcının ayarına uyğun bildiriş yaradılır:
 *  · AUTO   — dərhal göndərilməyə çalışılır;
 *  · MANUAL — növbəyə düşür, satıcı paneldən "Göndər" basır.
 * Kanalın provayderi qoşulmayıbsa, bildiriş itmir — `SKIPPED` kimi jurnalda qalır
 * və provayder qoşulan kimi yenidən göndərilə bilər.
 */

export const EVENT_LABELS: Record<NotificationEvent, string> = {
  ORDER_NEW: "Yeni sifariş",
  PAYMENT_CLAIMED: "Müştəri “Ödədim” bildirdi",
  PAYMENT_CONFIRMED: "Ödəniş təsdiqləndi",
  REVIEW_NEW: "Yeni rəy",
};

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  EMAIL: "E-poçt",
  SMS: "SMS",
  PUSH: "Push bildiriş",
};

export const STATUS_LABELS: Record<string, string> = {
  QUEUED: "Növbədə",
  SENT: "Göndərildi",
  FAILED: "Alınmadı",
  SKIPPED: "Kanal qoşulmayıb",
};

/** Kanalın texniki olaraq hazır olub-olmaması (açar / provayder). */
export function channelReady(channel: NotificationChannel) {
  if (channel === "EMAIL") return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
  return false; // SMS və push üçün provayder hələ qoşulmayıb (IR-03)
}

export type NotifyInput = {
  profileId: string;
  event: NotificationEvent;
  title: string;
  body: string;
  linkPath?: string;
  entityId?: string;
};

/**
 * Hadisəni qeydə alır və ayarlara uyğun bildiriş(lər) yaradır.
 * Əsas əməliyyatı (sifariş, ödəniş) heç vaxt dayandırmır: xəta udulur (NFR-REL-03).
 */
export async function notify(input: NotifyInput) {
  try {
    const profile = await db.profile.findUnique({
      where: { id: input.profileId },
      select: {
        notifyMode: true,
        notifyChannels: true,
        notifyEvents: true,
        notifyEmail: true,
        notifyPhone: true,
        phone: true,
        user: { select: { email: true } },
      },
    });
    if (!profile || !profile.notifyEvents.includes(input.event) || profile.notifyChannels.length === 0) return;

    for (const channel of profile.notifyChannels) {
      const target =
        channel === "EMAIL"
          ? (profile.notifyEmail ?? profile.user.email)
          : (profile.notifyPhone ?? profile.phone);

      const notification = await db.notification.create({
        data: {
          profileId: input.profileId,
          event: input.event,
          channel,
          mode: profile.notifyMode,
          target: target ?? null,
          title: input.title,
          body: input.body,
          linkPath: input.linkPath ?? null,
          entityId: input.entityId ?? null,
          status: "QUEUED",
        },
      });

      if (profile.notifyMode === "AUTO") await deliver(notification.id);
    }
  } catch (error) {
    console.error("bildiriş yaradılmadı", error);
  }
}

/** Növbədəki bildirişi göndərir. Manual düymə də, avtomatik rejim də buradan keçir. */
export async function deliver(notificationId: string) {
  const n = await db.notification.findUnique({ where: { id: notificationId } });
  if (!n || n.status === "SENT") return { ok: false, reason: "Bildiriş tapılmadı və ya artıq göndərilib" };

  if (!n.target) {
    await db.notification.update({ where: { id: n.id }, data: { status: "FAILED", error: "Ünvan yoxdur" } });
    return { ok: false, reason: "Göndəriləcək ünvan yoxdur — bildiriş ayarlarını yoxlayın" };
  }

  if (!channelReady(n.channel)) {
    await db.notification.update({
      where: { id: n.id },
      data: { status: "SKIPPED", error: `${CHANNEL_LABELS[n.channel]} provayderi qoşulmayıb` },
    });
    return { ok: false, reason: `${CHANNEL_LABELS[n.channel]} provayderi hələ qoşulmayıb` };
  }

  try {
    const sent = await sendEmail({ to: n.target, subject: n.title, text: n.body });
    await db.notification.update({
      where: { id: n.id },
      data: sent ? { status: "SENT", sentAt: new Date(), error: null } : { status: "FAILED", error: "Provayder cavab vermədi" },
    });
    return sent ? { ok: true } : { ok: false, reason: "E-poçt provayderi cavab vermədi" };
  } catch (error) {
    await db.notification.update({ where: { id: n.id }, data: { status: "FAILED", error: String((error as Error).message).slice(0, 200) } });
    return { ok: false, reason: "Göndərmə zamanı xəta baş verdi" };
  }
}

export const MODE_LABELS: Record<NotifyMode, string> = {
  AUTO: "Avtomatik: hadisə baş verən kimi göndərilir",
  MANUAL: "Manual: növbəyə düşür, özüm göndərirəm",
};
