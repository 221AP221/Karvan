"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdmin, requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/forms";
import { PLAN_NAMES } from "@/lib/plans";

const PLANS = ["FREE", "PRO", "PRO_MAX"] as const;

// Admin başqa adminə və özünə qarşı təhlükəli əməliyyat edə bilməz
async function target(id: string) {
  const user = await db.user.findUnique({ where: { id }, select: { id: true, email: true, role: true, profile: { select: { username: true } } } });
  if (!user) throw new Error("İstifadəçi tapılmadı");
  return user;
}

function refresh(userId?: string, username?: string) {
  revalidatePath("/admin", "layout");
  if (userId) revalidatePath(`/admin/users/${userId}`);
  if (username) revalidatePath(`/${username}`);
}

export async function setPlan(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const userId = String(form.get("userId") ?? "");
  const plan = String(form.get("plan") ?? "");
  if (!PLANS.includes(plan as (typeof PLANS)[number])) return { error: "Plan düzgün deyil" };
  const user = await target(userId);
  const before = await db.subscription.findUnique({ where: { userId } });
  await db.subscription.upsert({
    where: { userId },
    update: { plan: plan as (typeof PLANS)[number] },
    create: { userId, plan: plan as (typeof PLANS)[number] },
  });
  await logAdmin(admin, "plan_change", "user", userId, `${PLAN_NAMES[before?.plan ?? "FREE"]} → ${PLAN_NAMES[plan as (typeof PLANS)[number]]}`);
  refresh(userId, user.profile?.username);
  return { ok: true };
}

export async function blockUser(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const userId = String(form.get("userId") ?? "");
  const reason = String(form.get("reason") ?? "").trim().slice(0, 300);
  if (reason.length < 3) return { error: "Bloklama səbəbini yazın" };
  const user = await target(userId);
  if (user.role === "ADMIN") return { error: "Admin hesabı bloklana bilməz" };
  // Bloklananda bütün sessiyalar bağlanır: hesab dərhal çıxış edir
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { blockedAt: new Date(), blockReason: reason } }),
    db.session.deleteMany({ where: { userId } }),
  ]);
  await logAdmin(admin, "block", "user", userId, reason);
  refresh(userId, user.profile?.username);
  return { ok: true };
}

export async function unblockUser(userId: string) {
  const admin = await requireAdmin();
  const user = await target(userId);
  await db.user.update({ where: { id: userId }, data: { blockedAt: null, blockReason: null } });
  await logAdmin(admin, "unblock", "user", userId);
  refresh(userId, user.profile?.username);
}

export async function endUserSessions(userId: string) {
  const admin = await requireAdmin();
  await target(userId);
  if (userId === admin.id) return;
  const { count } = await db.session.deleteMany({ where: { userId } });
  await logAdmin(admin, "logout_sessions", "user", userId, `${count} sessiya`);
  refresh(userId);
}

export async function deleteUser(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const userId = String(form.get("userId") ?? "");
  const user = await target(userId);
  if (user.role === "ADMIN") return { error: "Admin hesabı silinə bilməz" };
  if (String(form.get("confirm") ?? "").trim().toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return { error: `Təsdiq üçün e-poçtu yazın: ${user.email}` };
  }
  // Profil, xidmətlər, fakturalar, şəkillər və sessiyalar cascade ilə silinir
  await db.user.delete({ where: { id: userId } });
  await logAdmin(admin, "delete_user", "user", userId, user.email ?? undefined);
  revalidatePath("/admin", "layout");
  redirect("/admin/users?deleted=1");
}

export async function setServiceBlocked(serviceId: string, blocked: boolean) {
  const admin = await requireAdmin();
  const service = await db.service.update({
    where: { id: serviceId },
    data: { blocked },
    select: { title: true, profile: { select: { username: true, userId: true } } },
  });
  await logAdmin(admin, blocked ? "service_block" : "service_unblock", "service", serviceId, `${service.title} (@${service.profile.username})`);
  refresh(service.profile.userId, service.profile.username);
  revalidatePath("/admin/services");
}
