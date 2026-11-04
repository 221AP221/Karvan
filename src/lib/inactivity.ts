import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/notify";

/**
 * Passiv hesabların təmizlənməsi (istifadəçi parametrlərdən idarə edir, defolt 90 gün).
 *
 * Axın: son aktivlikdən `days - NOTICE_DAYS` keçəndə xəbərdarlıq məktubu göndərilir,
 * `days` dolduqda hesab silinir. Hesaba hər giriş `lastSeenAt`-i yeniləyir və sayğacı sıfırlayır.
 */

export const AUTO_DELETE_OPTIONS = [90, 180, 365];
export const NOTICE_DAYS = 14; // silinmədən neçə gün əvvəl xəbərdarlıq
const DAY = 86_400_000;

export const daysLeft = (lastSeen: Date, days: number) => Math.ceil((lastSeen.getTime() + days * DAY - Date.now()) / DAY);

/** Təmizlənmə: əvvəlcə xəbərdarlıqlar, sonra müddəti dolmuş hesablar silinir. */
export async function runInactivityCleanup({ dryRun = false } = {}) {
  const now = Date.now();
  const candidates = await db.user.findMany({
    where: { autoDeleteAfterDays: { not: null }, role: "USER", blockedAt: null },
    select: { id: true, email: true, lastSeenAt: true, createdAt: true, autoDeleteAfterDays: true, inactiveNoticeAt: true },
    take: 5000,
  });

  const warned: string[] = [];
  const deleted: string[] = [];

  for (const u of candidates) {
    const days = u.autoDeleteAfterDays!;
    const last = u.lastSeenAt ?? u.createdAt;
    const idleDays = (now - last.getTime()) / DAY;

    if (idleDays >= days) {
      deleted.push(u.email ?? u.id);
      if (!dryRun) {
        await logActivity({ userId: u.id, email: u.email ?? undefined, action: "inactive_delete", details: `${Math.floor(idleDays)} gün passiv` });
        await db.user.delete({ where: { id: u.id } });
      }
      continue;
    }

    if (idleDays >= days - NOTICE_DAYS && !u.inactiveNoticeAt && u.email) {
      warned.push(u.email);
      if (!dryRun) {
        const left = Math.max(1, Math.ceil(days - idleDays));
        await sendEmail({
          to: u.email,
          subject: "Karvan: hesabınız silinmək üzrədir",
          text:
            `Salam!\n\nHesabınıza ${Math.floor(idleDays)} gündür giriş olmayıb. Parametrlərinizdə passiv hesabın ` +
            `avtomatik silinməsi açıqdır, ona görə hesab ${left} gün sonra silinəcək.\n\n` +
            `Saxlamaq üçün sadəcə hesabınıza daxil olun: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://karvan.az"}/login\n\n` +
            `Bu ayarı Parametrlər bölməsindən söndürə bilərsiniz.`,
        });
        await db.user.update({ where: { id: u.id }, data: { inactiveNoticeAt: new Date() } });
        await logActivity({ userId: u.id, email: u.email, action: "inactive_notice", details: `${left} gün qalıb` });
      }
    }
  }

  return { checked: candidates.length, warned, deleted };
}
