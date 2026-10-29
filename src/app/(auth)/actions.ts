"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { RESERVED_USERNAMES, USERNAME_RE } from "@/lib/username";

import type { FormState as AuthState } from "@/app/dashboard/actions";

const SignupInput = z.object({
  displayName: z.string().trim().min(2, "Adınızı yazın").max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_RE, "İstifadəçi adı 3-30 simvol: a-z, 0-9, _ və .")
    .refine((u) => !RESERVED_USERNAMES.has(u), "Bu ad istifadə edilə bilməz"),
  email: z.email("E-poçt düzgün deyil").trim().toLowerCase(),
  password: z.string().min(8, "Şifrə ən azı 8 simvol olmalıdır"),
});

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = SignupInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { displayName, username, email, password } = parsed.data;

  const [emailTaken, usernameTaken] = await Promise.all([
    db.user.findUnique({ where: { email } }),
    db.profile.findUnique({ where: { username } }),
  ]);
  if (emailTaken) return { error: "Bu e-poçt artıq qeydiyyatdan keçib" };
  if (usernameTaken) return { error: "Bu istifadəçi adı tutulub" };

  const user = await db.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      subscription: { create: { plan: "FREE" } },
      profile: {
        create: {
          username,
          displayName,
          invoicePrefix: username.replace(/[^a-z]/g, "").slice(0, 3).toUpperCase() || "INV",
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
    return { error: "E-poçt və ya şifrə yanlışdır" };
  }
  await startSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await endSession();
  redirect("/login");
}
