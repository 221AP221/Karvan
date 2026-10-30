"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { endSession, getCurrentUser, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { type Dict, getDictionary, getLocale } from "@/i18n/server";
import type { FormState } from "@/lib/forms";
import { sendEmail } from "@/lib/notify";
import { normalizePhone } from "@/lib/phone";
import { findValidReset, hashResetToken as sha256 } from "@/lib/password-reset";
import { RESERVED_USERNAMES, USERNAME_RE } from "@/lib/username";

export type AuthState = (FormState & { field?: string; devLink?: string }) | undefined;

const fail = (error: string, field?: string): AuthState => ({ error, field });

type Errors = Dict["auth"]["errors"];

// Xəta mətnləri seçilmiş dildə (giriş/qeydiyyat səhifələrinin dili cookie-dən gəlir)
const errors = async (): Promise<Errors> => getDictionary(await getLocale()).auth.errors;

const signupSchema = (e: Errors) =>
  z
    .object({
      firstName: z.string().trim().min(2, e.firstName).max(40),
      lastName: z.string().trim().min(2, e.lastName).max(40),
      brand: z.string().trim().max(80).transform((v) => v || null),
      phone: z
        .string()
        .transform((v) => normalizePhone(v))
        .refine((v) => v !== null, e.phone),
      citizenship: z.enum(["AZ", "FOREIGN"], e.citizenship),
      document: z.string().trim().toUpperCase().transform((v) => v.replace(/\s/g, "")),
      username: z
        .string()
        .trim()
        .toLowerCase()
        .regex(USERNAME_RE, e.username)
        .refine((u) => !RESERVED_USERNAMES.has(u), e.usernameReserved),
      email: z.email(e.email).trim().toLowerCase(),
      password: z.string().min(8, e.passwordShort).max(128),
      confirm: z.string(),
    })
    .superRefine((v, ctx) => {
      if (v.citizenship === "AZ" && !/^[A-Z0-9]{7}$/.test(v.document)) {
        ctx.addIssue({ code: "custom", path: ["document"], message: e.fin });
      }
      if (v.citizenship === "FOREIGN" && !/^[A-Z0-9]{5,20}$/.test(v.document)) {
        ctx.addIssue({ code: "custom", path: ["document"], message: e.passport });
      }
      if (v.password !== v.confirm) ctx.addIssue({ code: "custom", path: ["confirm"], message: e.mismatch });
    });

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const e = await errors();
  const parsed = signupSchema(e).safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(issue?.message ?? e.invalid, issue?.path[0]?.toString());
  }
  const { firstName, lastName, brand, phone, citizenship, document, username, email, password } = parsed.data;

  const [emailTaken, usernameTaken, phoneTaken, finTaken] = await Promise.all([
    db.user.findUnique({ where: { email }, select: { id: true } }),
    db.profile.findUnique({ where: { username }, select: { id: true } }),
    db.user.findUnique({ where: { phone: phone! }, select: { id: true } }),
    citizenship === "AZ" ? db.user.findUnique({ where: { finCode: document }, select: { id: true } }) : null,
  ]);
  if (emailTaken) return fail(e.emailTaken, "email");
  if (usernameTaken) return fail(e.usernameTaken, "username");
  if (phoneTaken) return fail(e.phoneTaken, "phone");
  if (finTaken) return fail(e.finTaken, "document");

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
          phone,
          displayName: brand ?? `${firstName} ${lastName}`,
          invoicePrefix: username.replace(/[^a-z]/g, "").slice(0, 3).toUpperCase() || "INV",
          accountName: `${firstName} ${lastName}`,
          theme: { primary: "#D6127E" },
        },
      },
    },
  });
  await startSession(user.id);
  await logActivity({ userId: user.id, email, action: "signup", details: `@${username}` });
  redirect("/dashboard/profile");
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email }, include: { profile: { select: { id: true } } } });
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    // Uğursuz cəhdlər: şifrə seçmə hücumlarını görmək üçün (mövcud olmayan e-poçt da qeyd olunur)
    await logActivity({ userId: user?.id, email: email.slice(0, 120), action: "login_failed" });
    return fail((await errors()).wrongLogin);
  }
  if (user.blockedAt) {
    await logActivity({ userId: user.id, email, action: "login_blocked" });
    return fail((await errors()).blocked);
  }
  if (user.role === "ADMIN") {
    await startSession(user.id);
    await logActivity({ userId: user.id, email, action: "login", details: "admin" });
    redirect(user.profile ? "/dashboard" : "/admin");
  }
  // Profilsiz hesab panelə daxil ola bilməz: səssizcə girişə qaytarmaq əvəzinə səbəbi deyirik
  if (!user.profile) return fail((await errors()).noProfile);
  await startSession(user.id);
  await logActivity({ userId: user.id, email, action: "login" });
  redirect("/dashboard");
}

export async function logout() {
  const current = await getCurrentUser();
  if (current) await logActivity({ userId: current.id, email: current.email, action: "logout" });
  await endSession();
  redirect("/login");
}

// Şifrə bərpası

const RESET_MINUTES = 30;

export async function requestPasswordReset(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!z.email().safeParse(email).success) return fail((await errors()).email);

  // Hesabın olub-olmadığını bildirmirik: cavab həmişə eynidir
  const done: AuthState = { ok: true };
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return done;

  const recent = await db.passwordReset.count({ where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 3_600_000) } } });
  if (recent >= 3) return done;

  await logActivity({ userId: user.id, email, action: "password_reset_request" });
  const token = randomBytes(32).toString("base64url");
  await db.passwordReset.create({
    data: { id: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000) },
  });
  const link = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
  const sent = await sendEmail({
    to: email,
    subject: "Karvan: şifrənin bərpası",
    text: `Salam!\n\nŞifrənizi yeniləmək üçün linkə keçin (${RESET_MINUTES} dəqiqə etibarlıdır):\n${link}\n\nBu sorğunu siz göndərməmisinizsə, məktubu nəzərə almayın.`,
  });
  // E-poçt xidməti qoşulmayıbsa, yalnız lokal işləmədə linki ekranda göstəririk
  if (!sent && process.env.NODE_ENV !== "production") return { ok: true, devLink: link };
  return done;
}

export async function resetPassword(_: AuthState, form: FormData): Promise<AuthState> {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const e = await errors();
  if (password.length < 8) return fail(e.passwordShort, "password");
  if (password !== String(form.get("confirm") ?? "")) return fail(e.mismatch, "confirm");

  const reset = await findValidReset(token);
  if (!reset) return fail(e.badLink);

  // Bütün açıq sessiyalar bağlanır, istifadə olunmamış digər linklər də etibarsız olur
  await db.$transaction([
    db.user.update({ where: { id: reset.userId }, data: { passwordHash: await hashPassword(password) } }),
    db.passwordReset.updateMany({ where: { userId: reset.userId, usedAt: null }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: reset.userId } }),
  ]);
  await logActivity({ userId: reset.userId, action: "password_reset" });
  redirect("/login?reset=1");
}
