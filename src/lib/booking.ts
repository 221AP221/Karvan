import { db } from "@/lib/db";
import type { ServiceLocation } from "@/generated/prisma/enums";

/** Slotlar bu addımla düzülür: 30 dəq tipik rezervasiya şəbəkəsidir. */
const STEP_MIN = 30;
export const DEFAULT_DURATION_MIN = 60;

export type BookingProfile = {
  bookingEnabled: boolean;
  bufferMin: number;
  travelBufferMin: number;
  workDays: string;
  workStart: string;
  workEnd: string;
};

/** "09:30" → 570. Yanlış dəyərdə null qaytarır ki, çağıran tərəf defolta düşsün. */
export function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [h, m] = [Number(match[1]), Number(match[2])];
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

export function formatTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** "1,2,5" → [1,2,5]; 1 = bazar ertəsi … 7 = bazar. */
export function parseWorkDays(value: string): number[] {
  return value
    .split(",")
    .map((d) => Number(d.trim()))
    .filter((d) => d >= 1 && d <= 7);
}

/** JS-in 0=bazar günü nömrələməsini 1=bazar ertəsi … 7=bazar formasına çevirir. */
export function isoWeekday(date: Date): number {
  return date.getDay() === 0 ? 7 : date.getDay();
}

/** Xidmətin təqvimdə tutduğu vaxt: seans + sabit bufer (+ yalnız ünvana gedişdə yol buferi). */
export function occupiedMinutes(profile: BookingProfile, durationMin: number, location: ServiceLocation): number {
  const travel = location === "CUSTOMER" ? profile.travelBufferMin : 0;
  return durationMin + profile.bufferMin + travel;
}

/** "2026-11-25" → həmin günün yerli yarısı. Yanlış dəyərdə null. */
export function parseDay(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

type Busy = { start: number; end: number };

/**
 * Seçilmiş gündə boş slotların başlanğıc vaxtları (FR-REZ-02, FR-REZ-03).
 * Dolu vaxtlar ümumiyyətlə qaytarılmır — müştəri yalnız boş slotları görür.
 */
export async function freeSlots(
  profileId: string,
  profile: BookingProfile,
  day: Date,
  durationMin: number,
  location: ServiceLocation,
): Promise<string[]> {
  if (!profile.bookingEnabled) return [];
  if (!parseWorkDays(profile.workDays).includes(isoWeekday(day))) return [];

  const start = parseTime(profile.workStart) ?? 9 * 60;
  const end = parseTime(profile.workEnd) ?? 18 * 60;
  if (end <= start) return [];

  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const [orders, blocks] = await Promise.all([
    db.order.findMany({
      where: { profileId, status: { not: "REJECTED" }, scheduledAt: { gte: dayStart, lt: dayEnd } },
      select: { scheduledAt: true, scheduledEndAt: true },
    }),
    db.blockedSlot.findMany({
      where: { profileId, start: { lt: dayEnd }, end: { gt: dayStart } },
      select: { start: true, end: true },
    }),
  ]);

  const toMinutes = (date: Date) => (date.getTime() - dayStart.getTime()) / 60000;
  const busy: Busy[] = [
    ...orders
      .filter((o) => o.scheduledAt)
      .map((o) => ({ start: toMinutes(o.scheduledAt!), end: toMinutes(o.scheduledEndAt ?? o.scheduledAt!) })),
    ...blocks.map((b) => ({ start: toMinutes(b.start), end: toMinutes(b.end) })),
  ];

  const need = occupiedMinutes(profile, durationMin, location);
  const nowMin = isSameDay(day, new Date()) ? (Date.now() - dayStart.getTime()) / 60000 : -Infinity;

  const slots: string[] = [];
  for (let slot = start; slot + durationMin <= end; slot += STEP_MIN) {
    if (slot <= nowMin) continue; // keçmiş saat təklif olunmur
    const slotEnd = slot + need;
    if (busy.some((b) => slot < b.end && slotEnd > b.start)) continue;
    slots.push(formatTime(slot));
  }
  return slots;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Slotun hələ də boş olduğunu yoxlayır (BRU-30: eyni slota iki sifariş düşməsin). */
export async function slotIsFree(profileId: string, start: Date, end: Date): Promise<boolean> {
  const [order, block] = await Promise.all([
    db.order.findFirst({
      where: {
        profileId,
        status: { not: "REJECTED" },
        scheduledAt: { lt: end },
        scheduledEndAt: { gt: start },
      },
      select: { id: true },
    }),
    db.blockedSlot.findFirst({
      where: { profileId, start: { lt: end }, end: { gt: start } },
      select: { id: true },
    }),
  ]);
  return !order && !block;
}

/** Seçilmiş gün və saatdan rezervasiyanın başlama/bitmə anlarını qurur. */
export function slotRange(
  profile: BookingProfile,
  day: Date,
  time: string,
  durationMin: number,
  location: ServiceLocation,
): { start: Date; end: Date } | null {
  const minutes = parseTime(time);
  if (minutes === null) return null;
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);
  const end = new Date(start.getTime() + occupiedMinutes(profile, durationMin, location) * 60000);
  return { start, end };
}
