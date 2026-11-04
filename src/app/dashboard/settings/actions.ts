"use server";

import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, hashPassword, requireProfile, verifyPassword } from "@/lib/auth";
import { AUTO_DELETE_OPTIONS } from "@/lib/inactivity";
import { db } from "@/lib/db";
import { type FormState, firstError, optional } from "@/lib/forms";

async function checkPassword(userId: string, password: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  return Boolean(user?.passwordHash && (await verifyPassword(password, user.passwordHash)));
}

export async function changeEmail(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const parsed = z
    .object({ email: z.email("E-poçt düzgün deyil").trim().toLowerCase(), password: z.string().min(1, "Şifrəni yazın") })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (!(await checkPassword(profile.userId, parsed.data.password))) return { error: "Şifrə yanlışdır" };
  if (parsed.data.email === profile.user.email) return { error: "Bu, hazırkı e-poçtunuzdur" };
  if (await db.user.findUnique({ where: { email: parsed.data.email } })) return { error: "Bu e-poçt artıq istifadə olunur" };
  await db.user.update({ where: { id: profile.userId }, data: { email: parsed.data.email } });
  await logActivity({ userId: profile.userId, email: parsed.data.email, action: "email_change", details: `${profile.user.email} → ${parsed.data.email}` });
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const parsed = z
    .object({
      current: z.string().min(1, "Hazırkı şifrəni yazın"),
      next: z.string().min(8, "Yeni şifrə ən azı 8 simvol olmalıdır"),
      confirm: z.string(),
    })
    .refine((v) => v.next === v.confirm, "Yeni şifrələr eyni deyil")
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (!(await checkPassword(profile.userId, parsed.data.current))) return { error: "Hazırkı şifrə yanlışdır" };

  // Şifrə dəyişəndə digər cihazlardakı sessiyalar bağlanır
  await db.$transaction([
    db.user.update({ where: { id: profile.userId }, data: { passwordHash: await hashPassword(parsed.data.next) } }),
    db.session.deleteMany({ where: { userId: profile.userId, id: { not: profile.sessionId } } }),
  ]);
  await logActivity({ userId: profile.userId, email: profile.user.email, action: "password_change" });
  return { ok: true };
}

const PaymentInput = z.object({
  invoicePrefix: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,6}$/, "Prefiks 2-6 hərf/rəqəm olmalıdır"),
  accountName: optional,
  bankName: optional,
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .refine((v) => v === "" || /^\d{16}$/.test(v), "Kart nömrəsi 16 rəqəm olmalıdır")
    .transform((v) => (v ? v.replace(/(\d{4})(?=\d)/g, "$1 ") : null)),
  iban: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => v.replace(/\s/g, "") || null)
    .refine((v) => v === null || /^AZ\d{2}[A-Z0-9]{24}$/.test(v), "IBAN AZ ilə başlamalı və 28 simvol olmalıdır"),
});

export async function updatePaymentSettings(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const parsed = PaymentInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };
  await db.profile.update({ where: { id: profile.id }, data: parsed.data });
  await logActivity({ userId: profile.userId, email: profile.user.email, action: "payment_settings" });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function setCatalogVisibility(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  await db.profile.update({ where: { id: profile.id }, data: { showInCatalog: form.get("showInCatalog") === "on" } });
  await logActivity({ userId: profile.userId, email: profile.user.email, action: "catalog_visibility", details: form.get("showInCatalog") === "on" ? "görünür" : "gizli" });
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function signOutOtherDevices(): Promise<FormState> {
  const profile = await requireProfile();
  await db.session.deleteMany({ where: { userId: profile.userId, id: { not: profile.sessionId } } });
  await logActivity({ userId: profile.userId, email: profile.user.email, action: "sessions_end" });
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  if (String(form.get("confirmUsername") ?? "").trim().toLowerCase() !== profile.username) {
    return { error: `Təsdiq üçün istifadəçi adınızı yazın: ${profile.username}` };
  }
  if (!(await checkPassword(profile.userId, String(form.get("password") ?? "")))) return { error: "Şifrə yanlışdır" };
  await endSession();
  // Profil, xidmətlər, fakturalar, şəkillər və sessiyalar cascade ilə silinir
  await db.user.delete({ where: { id: profile.userId } });
  await logActivity({ userId: profile.userId, email: profile.user.email, action: "account_delete", details: `@${profile.username}` });
  redirect("/");
}

/**
 * Passiv hesabın avtomatik silinməsi (defolt olaraq açıqdır).
 * Seçilən müddət ərzində girişi olmayan hesab təmizlənmə prosesində silinir;
 * silinmədən əvvəl xəbərdarlıq göndərilir (§ docs/BURAXILIS.md).
 */
export async function setAutoDelete(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const enabled = form.get("autoDelete") === "on";
  const raw = Number(form.get("days"));
  const days = AUTO_DELETE_OPTIONS.includes(raw) ? raw : 90;
  await db.user.update({
    where: { id: profile.userId },
    data: { autoDeleteAfterDays: enabled ? days : null, inactiveNoticeAt: null },
  });
  await logActivity({
    userId: profile.userId,
    email: profile.user.email,
    action: "auto_delete_settings",
    details: enabled ? `${days} gün` : "söndürüldü",
  });
  revalidatePath("/dashboard/settings");
  return { ok: true };
}
