import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { expireIfNeeded } from "@/lib/billing";
import { db } from "@/lib/db";
import { PermissionError, type Permission, can } from "@/lib/team";

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
  // Son aktivlik: passiv hesabların təmizlənməsi bu tarixə baxır (src/lib/inactivity.ts)
  await db.user.update({ where: { id: userId }, data: { lastSeenAt: new Date(), inactiveNoticeAt: null } });
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

/**
 * Cari iş sahəsi: ya istifadəçinin öz səhifəsi, ya da üzvü olduğu komandanın səhifəsi.
 *
 * Qaytarılan obyekt profilin özüdür (köhnə çağırışlar dəyişmir), üstəlik:
 *  · `user` — iş sahəsinin SAHİBİNİN hesabı (tarif, limitlər, rekvizitlər ona bağlıdır);
 *  · `actor` — əməliyyatı edən şəxs (sahib və ya komanda üzvü);
 *  · `role` / `isOwner` — icazə yoxlamaları üçün.
 */
export const getCurrentProfile = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: sha256(token) },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true, role: true, blockedAt: true, subscription: true, profile: true } } },
  });
  // Bloklanmış hesabın sessiyası etibarsızdır
  if (!session || session.expiresAt < new Date() || session.user.blockedAt) return null;

  const actor = {
    id: session.user.id,
    email: session.user.email,
    name: [session.user.firstName, session.user.lastName].filter(Boolean).join(" ") || session.user.email,
  };

  // Komanda iş sahəsi seçilibsə, üzvlük hələ də etibarlı olmalıdır
  if (session.activeProfileId && session.activeProfileId !== session.user.profile?.id) {
    const membership = await db.membership.findFirst({
      where: { profileId: session.activeProfileId, userId: session.user.id, status: "ACTIVE" },
      include: {
        profile: { include: { user: { select: { id: true, email: true, role: true, blockedAt: true, subscription: true } } } },
      },
    });
    if (membership && !membership.profile.user.blockedAt) {
      const { user: owner, ...profile } = membership.profile;
      if (await expireIfNeeded(owner.id, owner.subscription)) owner.subscription = { ...owner.subscription!, plan: "FREE", currentPeriodEnd: null };
      return { ...profile, user: owner, actor, role: membership.role, isOwner: false, sessionId: session.id };
    }
    // Üzvlük bitib və ya dondurulub: öz səhifəsinə qaytarırıq
    await db.session.update({ where: { id: session.id }, data: { activeProfileId: null } }).catch(() => {});
  }

  if (!session.user.profile) return null;
  if (await expireIfNeeded(session.user.id, session.user.subscription)) session.user.subscription = { ...session.user.subscription!, plan: "FREE", currentPeriodEnd: null };
  const { profile, ...user } = session.user;
  return { ...profile, user, actor, role: "OWNER" as const, isOwner: true, sessionId: session.id };
});

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

/**
 * İcazə tələb edən əməliyyatlar üçün: rol kifayət etmirsə, əməliyyat dayanır.
 * Server action-larda `const ws = await requirePermission("billing")` kimi işlədilir.
 */
export async function requirePermission(permission: Permission) {
  const profile = await requireProfile();
  if (!can(profile.role, permission)) throw new PermissionError();
  return profile;
}

/** Səhifələr üçün: icazə yoxdursa panelin əsas səhifəsinə qaytarır. */
export async function requirePageAccess(permission: Permission) {
  const profile = await requireProfile();
  if (!can(profile.role, permission)) redirect("/dashboard");
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
