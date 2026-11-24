"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/auth";
import { parseTime } from "@/lib/booking";
import { db } from "@/lib/db";
import { type FormState, firstError } from "@/lib/forms";

const time = z.string().refine((v) => parseTime(v) !== null, "Saat SS:DD formatında olmalıdır");

const SettingsInput = z
  .object({
    bookingEnabled: z.union([z.literal("on"), z.undefined()]).transform((v) => v === "on"),
    bufferMin: z.coerce.number().int().min(0).max(240),
    travelBufferMin: z.coerce.number().int().min(0).max(240),
    workStart: time,
    workEnd: time,
  })
  .refine((v) => parseTime(v.workEnd)! > parseTime(v.workStart)!, { message: "İşin bitmə saatı başlama saatından sonra olmalıdır", path: ["workEnd"] });

export async function saveBookingSettings(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requirePermission("services");
  const parsed = SettingsInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };

  // İş günləri checkbox-lardan gəlir: "1,3,5" kimi saxlanılır
  const days = form
    .getAll("workDays")
    .map((d) => Number(d))
    .filter((d) => d >= 1 && d <= 7)
    .sort((a, b) => a - b);
  if (parsed.data.bookingEnabled && days.length === 0) return { error: "Ən azı bir iş günü seçin" };

  await db.profile.update({ where: { id: profile.id }, data: { ...parsed.data, workDays: days.join(",") } });
  await logActivity({
    userId: profile.userId,
    email: profile.user.email,
    profileId: profile.id,
    actor: profile.actor,
    action: "booking_settings",
    details: parsed.data.bookingEnabled ? "rezervasiya aktiv" : "rezervasiya söndürülüb",
  });
  revalidatePath("/dashboard/booking");
  revalidatePath(`/${profile.username}`);
  return { ok: true };
}

const BlockInput = z
  .object({
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarix seçin"),
    allDay: z.union([z.literal("on"), z.undefined()]).transform((v) => v === "on"),
    start: z.string(),
    end: z.string(),
    note: z.string().trim().max(120).transform((v) => v || null),
  })
  .transform((v, ctx) => {
    const [y, m, d] = v.day.split("-").map(Number);
    if (v.allDay) return { start: new Date(y, m - 1, d), end: new Date(y, m - 1, d + 1), note: v.note };
    const from = parseTime(v.start);
    const to = parseTime(v.end);
    if (from === null || to === null) {
      ctx.addIssue({ code: "custom", message: "Saatları SS:DD formatında yazın" });
      return z.NEVER;
    }
    if (to <= from) {
      ctx.addIssue({ code: "custom", message: "Bitmə saatı başlama saatından sonra olmalıdır" });
      return z.NEVER;
    }
    return { start: new Date(y, m - 1, d, 0, from), end: new Date(y, m - 1, d, 0, to), note: v.note };
  });

export async function blockSlot(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requirePermission("services");
  const parsed = BlockInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };

  await db.blockedSlot.create({ data: { profileId: profile.id, ...parsed.data } });
  revalidatePath("/dashboard/booking");
  return { ok: true };
}

export async function unblockSlot(id: string) {
  const profile = await requirePermission("services");
  await db.blockedSlot.deleteMany({ where: { id, profileId: profile.id } });
  revalidatePath("/dashboard/booking");
}
