"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/forms";
import { sendEmail } from "@/lib/notify";
import { findValidReset, hashResetToken as sha256 } from "@/lib/password-reset";
import { RESERVED_USERNAMES, USERNAME_RE } from "@/lib/username";

export type AuthState = (FormState & { field?: string; devLink?: string }) | undefined;

const fail = (error: string, field?: string): AuthState => ({ error, field });

// +994 50 123 45 67 / 050 123 45 67 → +994501234567; xarici nömrələr + ilə 8-15 rəqəm
function normalizePhone(input: string): string | null {
  const raw = input.replace(/[\s()-]/g, "");
  if (/^0\d{9}$/.test(raw)) return `+994${raw.slice(1)}`;
  if (/^\+994\d{9}$/.test(raw)) return raw;
  if (/^994\d{9}$/.test(raw)) return `+${raw}`;
  if (/^\+[1-9]\d{7,14}$/.test(raw)) return raw;
  return null;
}

const SignupInput = z
  .object({
    firstName: z.string().trim().min(2, "Adınızı yazın").max(40),
    lastName: z.string().trim().min(2, "Soyadınızı yazın").max(40),
    brand: z.string().trim().max(80).transform((v) => v || null),
    phone: z
      .string()
      .transform((v) => normalizePhone(v))
      .refine((v) => v !== null, "Əlaqə nömrəsi düzgün deyil (məs. +994 50 123 45 67)"),
    citizenship: z.enum(["AZ", "FOREIGN"], "Vətəndaşlığı seçin"),
    document: z.string().trim().toUpperCase().transform((v) => v.replace(/\s/g, "")),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(USERNAME_RE, "Səhifə ünvanı 3-30 simvol: a-z, 0-9, _ və .")
      .refine((u) => !RESERVED_USERNAMES.has(u), "Bu ünvan istifadə edilə bilməz"),
    email: z.email("E-poçt düzgün deyil").trim().toLowerCase(),
    password: z.string().min(8, "Şifrə ən azı 8 simvol olmalıdır").max(128),
    confirm: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.citizenship === "AZ" && !/^[A-Z0-9]{7}$/.test(v.document)) {
      ctx.addIssue({ code: "custom", path: ["document"], message: "FİN kod 7 simvol olmalıdır (hərf və rəqəm)" });
    }
    if (v.citizenship === "FOREIGN" && !/^[A-Z0-9]{5,20}$/.test(v.document)) {
      ctx.addIssue({ code: "custom", path: ["document"], message: "Pasport nömrəsi 5-20 hərf/rəqəm olmalıdır" });
    }
    if (v.password !== v.confirm) ctx.addIssue({ code: "custom", path: ["confirm"], message: "Şifrələr eyni deyil" });
  });

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = SignupInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(issue?.message ?? "Məlumatlar düzgün deyil", issue?.path[0]?.toString());
  }
  const { firstName, lastName, brand, phone, citizenship, document, username, email, password } = parsed.data;

  const [emailTaken, usernameTaken, phoneTaken, finTaken] = await Promise.all([
    db.user.findUnique({ where: { email }, select: { id: true } }),
    db.profile.findUnique({ where: { username }, select: { id: true } }),
    db.user.findUnique({ where: { phone: phone! }, select: { id: true } }),
    citizenship === "AZ" ? db.user.findUnique({ where: { finCode: document }, select: { id: true } }) : null,
  ]);
  if (emailTaken) return fail("Bu e-poçt artıq qeydiyyatdan keçib", "email");
  if (usernameTaken) return fail("Bu səhifə ünvanı tutulub", "username");
  if (phoneTaken) return fail("Bu nömrə ilə artıq hesab var", "phone");
  if (finTaken) return fail("Bu FİN kod ilə artıq hesab var", "document");

  const user = await db.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      citizenship,
      finCode: citizenship === "AZ" ? document : null,
      passportNumber: citizenship === "FOREIGN" ? document : null,
      passwordHash: await hashPassword(password),
      subscription: { create: { plan: "FREE" } },
      profile: {
        create: {
          username,
          displayName: brand ?? `${firstName} ${lastName}`,
          invoicePrefix: username.replace(/[^a-z]/g, "").slice(0, 3).toUpperCase() || "INV",
          accountName: `${firstName} ${lastName}`,
          theme: { primary: "#6d28d9" },
        },
      },
    },
  });
  await startSession(user.id);
  redirect("/dashboard/profile");
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return fail("E-poçt və ya şifrə yanlışdır");
  }
  await startSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

// Şifrə bərpası

const RESET_MINUTES = 30;

export async function requestPasswordReset(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!z.email().safeParse(email).success) return fail("E-poçt düzgün deyil");

  // Hesabın olub-olmadığını bildirmirik: cavab həmişə eynidir
  const done: AuthState = { ok: true };
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return done;

  const recent = await db.passwordReset.count({ where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 3_600_000) } } });
  if (recent >= 3) return done;

  const token = randomBytes(32).toString("base64url");
  await db.passwordReset.create({
    data: { id: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000) },
  });
  const link = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
  const sent = await sendEmail({
    to: email,
    subject: "BioFaktura: şifrənin bərpası",
    text: `Salam!\n\nŞifrənizi yeniləmək üçün linkə keçin (${RESET_MINUTES} dəqiqə etibarlıdır):\n${link}\n\nBu sorğunu siz göndərməmisinizsə, məktubu nəzərə almayın.`,
  });
  // E-poçt xidməti qoşulmayıbsa, yalnız lokal işləmədə linki ekranda göstəririk
  if (!sent && process.env.NODE_ENV !== "production") return { ok: true, devLink: link };
  return done;
}

export async function resetPassword(_: AuthState, form: FormData): Promise<AuthState> {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return fail("Şifrə ən azı 8 simvol olmalıdır", "password");
  if (password !== String(form.get("confirm") ?? "")) return fail("Şifrələr eyni deyil", "confirm");

  const reset = await findValidReset(token);
  if (!reset) return fail("Link etibarsızdır və ya vaxtı keçib. Yenidən sorğu göndərin.");

  // Bütün açıq sessiyalar bağlanır, istifadə olunmamış digər linklər də etibarsız olur
  await db.$transaction([
    db.user.update({ where: { id: reset.userId }, data: { passwordHash: await hashPassword(password) } }),
    db.passwordReset.updateMany({ where: { userId: reset.userId, usedAt: null }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: reset.userId } }),
  ]);
  redirect("/login?reset=1");
}
