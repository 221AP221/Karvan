"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, hashPassword, requireProfile, verifyPassword } from "@/lib/auth";
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
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function setCatalogVisibility(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  await db.profile.update({ where: { id: profile.id }, data: { showInCatalog: form.get("showInCatalog") === "on" } });
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function signOutOtherDevices(): Promise<FormState> {
  const profile = await requireProfile();
  await db.session.deleteMany({ where: { userId: profile.userId, id: { not: profile.sessionId } } });
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
  redirect("/");
}
