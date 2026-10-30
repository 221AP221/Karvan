import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";

// MVP: e-poçt + şifrə. PRD-dəki SMS OTP / Google girişi bu modulun üzərinə əlavə olunacaq.

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = "sid";
const SESSION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = await scryptAsync(password, Buffer.from(salt, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.session.create({ data: { id: sha256(token), userId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(COOKIE);
}

export const getCurrentProfile = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: sha256(token) },
    include: { user: { select: { id: true, email: true, role: true, blockedAt: true, subscription: true, profile: true } } },
  });
  // Bloklanmış hesabın sessiyası etibarsızdır
  if (!session || session.expiresAt < new Date() || !session.user.profile || session.user.blockedAt) return null;
  const { profile, ...user } = session.user;
  return { ...profile, user, sessionId: session.id };
});

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

// Profili olmayan hesablar (admin) daxil olmaqla cari istifadəçi
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: sha256(token) },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true, role: true, blockedAt: true } } },
  });
  if (!session || session.expiresAt < new Date() || session.user.blockedAt) return null;
  return { ...session.user, sessionId: session.id };
});

// Super admin "istifadəçi kimi daxil olur": admin sessiyası ayrıca cookie-də saxlanılır, qayıdanda bərpa olunur.
// İstifadəçinin öz sessiyalarına toxunulmur, admin sessiyası 2 saatdan sonra bərpa üçün yararsızdır.
const ADMIN_COOKIE = "admin_sid";

export async function startImpersonation(userId: string) {
  const jar = await cookies();
  const adminToken = jar.get(COOKIE)?.value;
  if (!adminToken) throw new Error("Admin sessiyası yoxdur");
  jar.set(ADMIN_COOKIE, adminToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 2 * 3600 });
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 2 * 3600_000);
  await db.session.create({ data: { id: sha256(token), userId, expiresAt } });
  jar.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
}

export async function isImpersonating() {
  return Boolean((await cookies()).get(ADMIN_COOKIE)?.value);
}

export async function stopImpersonation() {
  const jar = await cookies();
  const adminToken = jar.get(ADMIN_COOKIE)?.value;
  const current = jar.get(COOKIE)?.value;
  if (current) await db.session.deleteMany({ where: { id: sha256(current) } });
  jar.delete(ADMIN_COOKIE);
  if (adminToken) jar.set(COOKIE, adminToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_DAYS * 86400 });
  return Boolean(adminToken);
}
