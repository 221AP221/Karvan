"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { logAdmin, requireAdmin, requireSuperAdmin } from "@/lib/admin";
import { setPlanKeepingTime } from "@/lib/billing";
import { COUPON_RE, normalizeCode } from "@/lib/coupons";
import { refreshRating } from "@/lib/reviews";
import { pingAi } from "@/lib/ai";
import { STALE_CLIENT, getStoredAi, saveStoredAi, settingsReady } from "@/lib/ai-settings";
import { hashPassword, startImpersonation } from "@/lib/auth";
import { activatePayment } from "@/lib/billing";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/forms";
import { normalizePhone } from "@/lib/phone";
import { PLAN_NAMES } from "@/lib/plans";
import { RESERVED_USERNAMES, USERNAME_RE } from "@/lib/username";

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
  // Müddət itmir: eyni tarifdə toxunulmur, dəyişəndə qalan dəyər yeni tarifə keçir (FR-ABN-11)
  await setPlanKeepingTime(userId, plan as (typeof PLANS)[number]);
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
  if (user.role !== "USER") return { error: "Admin hesabı bloklana bilməz" };
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
  if (user.role !== "USER") return { error: "Admin hesabı silinə bilməz" };
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

// Siyahıdan sürətli və toplu əməliyyatlar

export type BulkResult = { ok?: boolean; error?: string; done?: number; skipped?: number };

const clean = (ids: unknown) => (Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string").slice(0, 200) : []);

// Tarifi bir pillə qaldırır (+1) və ya salır (-1)
export async function stepPlan(userId: string, direction: 1 | -1): Promise<BulkResult> {
  const admin = await requireAdmin();
  const sub = await db.subscription.findUnique({ where: { userId } });
  const current = sub?.plan ?? "FREE";
  const next = PLANS[PLANS.indexOf(current) + direction];
  if (!next) return { error: direction > 0 ? "Artıq ən yüksək tarifdədir" : "Artıq pulsuz tarifdədir" };
  const user = await target(userId);
  await setPlanKeepingTime(userId, next);
  await logAdmin(admin, "plan_change", "user", userId, `${PLAN_NAMES[current]} → ${PLAN_NAMES[next]}`);
  refresh(userId, user.profile?.username);
  return { ok: true, done: 1 };
}

export async function bulkSetPlan(ids: string[], plan: string): Promise<BulkResult> {
  const admin = await requireAdmin();
  if (!PLANS.includes(plan as (typeof PLANS)[number])) return { error: "Plan düzgün deyil" };
  const list = clean(ids);
  let done = 0;
  for (const userId of list) {
    const before = await db.subscription.findUnique({ where: { userId } });
    if (before?.plan === plan) continue;
    await setPlanKeepingTime(userId, plan as (typeof PLANS)[number]);
    await logAdmin(admin, "plan_change", "user", userId, `${PLAN_NAMES[before?.plan ?? "FREE"]} → ${PLAN_NAMES[plan as (typeof PLANS)[number]]}`);
    done++;
  }
  refresh();
  return { ok: true, done, skipped: list.length - done };
}

export async function bulkBlock(ids: string[], reason: string): Promise<BulkResult> {
  const admin = await requireAdmin();
  const why = reason.trim().slice(0, 300);
  if (why.length < 3) return { error: "Bloklama səbəbini yazın" };
  const list = clean(ids);
  // Adminlər və artıq bloklananlar ötürülür
  const users = await db.user.findMany({ where: { id: { in: list }, role: "USER", blockedAt: null }, select: { id: true } });
  for (const { id } of users) {
    await db.$transaction([
      db.user.update({ where: { id }, data: { blockedAt: new Date(), blockReason: why } }),
      db.session.deleteMany({ where: { userId: id } }),
    ]);
    await logAdmin(admin, "block", "user", id, why);
  }
  refresh();
  return { ok: true, done: users.length, skipped: list.length - users.length };
}

export async function bulkUnblock(ids: string[]): Promise<BulkResult> {
  const admin = await requireAdmin();
  const list = clean(ids);
  const users = await db.user.findMany({ where: { id: { in: list }, blockedAt: { not: null } }, select: { id: true } });
  for (const { id } of users) {
    await db.user.update({ where: { id }, data: { blockedAt: null, blockReason: null } });
    await logAdmin(admin, "unblock", "user", id);
  }
  refresh();
  return { ok: true, done: users.length, skipped: list.length - users.length };
}

export async function bulkEndSessions(ids: string[]): Promise<BulkResult> {
  const admin = await requireAdmin();
  const list = clean(ids).filter((id) => id !== admin.id);
  let done = 0;
  for (const id of list) {
    const { count } = await db.session.deleteMany({ where: { userId: id } });
    if (count) {
      await logAdmin(admin, "logout_sessions", "user", id, `${count} sessiya`);
      done++;
    }
  }
  refresh();
  return { ok: true, done, skipped: list.length - done };
}

// İstifadəçi məlumatlarının düzəlişi
export async function updateUser(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const userId = String(form.get("userId") ?? "");
  const user = await db.user.findUnique({ where: { id: userId }, include: { profile: true } });
  if (!user) return { error: "İstifadəçi tapılmadı" };

  const str = (k: string) => String(form.get(k) ?? "").trim();
  const email = str("email").toLowerCase();
  const phoneRaw = str("phone");
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  const username = str("username").toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "E-poçt düzgün deyil" };
  if (phoneRaw && !phone) return { error: "Telefon nömrəsi düzgün deyil" };
  if (user.profile && (!USERNAME_RE.test(username) || RESERVED_USERNAMES.has(username))) return { error: "Səhifə ünvanı düzgün deyil (3-30 simvol: a-z, 0-9, _ və .)" };

  const [emailTaken, phoneTaken, usernameTaken] = await Promise.all([
    email !== user.email ? db.user.findUnique({ where: { email }, select: { id: true } }) : null,
    phone && phone !== user.phone ? db.user.findUnique({ where: { phone }, select: { id: true } }) : null,
    user.profile && username !== user.profile.username ? db.profile.findUnique({ where: { username }, select: { id: true } }) : null,
  ]);
  if (emailTaken) return { error: "Bu e-poçt başqa hesabdadır" };
  if (phoneTaken) return { error: "Bu nömrə başqa hesabdadır" };
  if (usernameTaken) return { error: "Bu səhifə ünvanı tutulub" };

  const changes: string[] = [];
  const track = (label: string, a: unknown, b: unknown) => a !== b && changes.push(`${label}: ${a ?? "—"} → ${b ?? "—"}`);
  track("ad", user.firstName, str("firstName") || null);
  track("soyad", user.lastName, str("lastName") || null);
  track("e-poçt", user.email, email);
  track("telefon", user.phone, phone);

  await db.user.update({ where: { id: userId }, data: { firstName: str("firstName") || null, lastName: str("lastName") || null, email, phone } });
  if (user.profile) {
    const displayName = str("displayName") || user.profile.displayName;
    track("səhifə", user.profile.username, username);
    track("göstərilən ad", user.profile.displayName, displayName);
    track("peşə", user.profile.profession, str("profession") || null);
    track("şəhər", user.profile.city, str("city") || null);
    await db.profile.update({ where: { id: user.profile.id }, data: { username, displayName, profession: str("profession") || null, city: str("city") || null } });
    revalidatePath(`/${user.profile.username}`);
  }
  if (changes.length) await logAdmin(admin, "user_edit", "user", userId, changes.join("; ").slice(0, 500));
  refresh(userId, username);
  return { ok: true };
}

// Şifrələr: hash kimi saxlanılır, heç kim (admin də) görə bilməz. Admin yenisini təyin edir.
export type PasswordState = ({ error?: string; ok?: boolean; temp?: string }) | undefined;

export async function setUserPassword(_: PasswordState, form: FormData): Promise<PasswordState> {
  const admin = await requireAdmin();
  const userId = String(form.get("userId") ?? "");
  const user = await target(userId);
  if (user.role !== "USER" && admin.role !== "SUPER_ADMIN") return { error: "Admin şifrəsini yalnız super admin dəyişə bilər" };
  const generate = form.get("generate") === "1";
  const password = generate ? tempPassword() : String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Şifrə ən azı 8 simvol olmalıdır" };
  // Yeni şifrə ilə köhnə sessiyalar və bərpa linkləri etibarsız olur
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password) } }),
    db.session.deleteMany({ where: { userId } }),
    db.passwordReset.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } }),
  ]);
  await logAdmin(admin, "password_set", "user", userId, generate ? "müvəqqəti şifrə yaradıldı" : "yeni şifrə təyin edildi");
  refresh(userId);
  return { ok: true, temp: generate ? password : undefined };
}

function tempPassword() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  return Array.from(bytes, (b) => abc[b % abc.length]).join("");
}

export async function setRole(userId: string, role: "USER" | "ADMIN" | "SUPER_ADMIN") {
  const admin = await requireSuperAdmin();
  if (userId === admin.id) return;
  const user = await target(userId);
  if (role === "USER" && user.role === "SUPER_ADMIN" && (await db.user.count({ where: { role: "SUPER_ADMIN" } })) <= 1) return;
  await db.user.update({ where: { id: userId }, data: { role } });
  await db.session.deleteMany({ where: { userId } });
  await logAdmin(admin, "role_change", "user", userId, `${user.role} → ${role}`);
  refresh(userId);
}

export async function impersonate(userId: string) {
  const admin = await requireSuperAdmin();
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true, blockedAt: true, profile: { select: { id: true } } } });
  if (!user?.profile || user.role !== "USER" || user.blockedAt) return;
  await logAdmin(admin, "impersonate", "user", userId);
  await startImpersonation(userId);
  redirect("/dashboard");
}

// Abunəlik ödənişləri: bank köçürməsini təsdiq və ya rədd
export async function confirmBillingPayment(paymentId: string) {
  const admin = await requireAdmin();
  const p = await db.subscriptionPayment.findUnique({ where: { id: paymentId } });
  if (!p || p.method !== "BANK_TRANSFER" || (p.status !== "PENDING" && p.status !== "PAID")) return;
  await db.subscriptionPayment.update({ where: { id: paymentId }, data: { status: "PAID", paidAt: p.paidAt ?? new Date() } });
  await activatePayment(paymentId);
  await logAdmin(admin, "billing_confirm", "user", p.userId, `${p.reference} · ${PLAN_NAMES[p.plan]} · ${p.months} ay`);
  revalidatePath("/admin/payments");
  refresh(p.userId);
}

export async function rejectBillingPayment(paymentId: string) {
  const admin = await requireAdmin();
  const p = await db.subscriptionPayment.findUnique({ where: { id: paymentId } });
  if (!p || p.method !== "BANK_TRANSFER" || p.status !== "PENDING") return;
  await db.subscriptionPayment.update({ where: { id: paymentId }, data: { status: "REJECTED" } });
  await logAdmin(admin, "billing_reject", "user", p.userId, p.reference);
  revalidatePath("/admin/payments");
}

// AI ayarı: açar bazada şifrələnmiş saxlanılır, yalnız super admin dəyişə bilər
const AI_PROVIDERS = ["groq", "gemini", "openrouter", "xai", "ollama", "anthropic"];

export async function saveAiSettings(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireSuperAdmin();
  const provider = String(form.get("provider") ?? "");
  if (provider === "off") {
    await saveStoredAi(null);
    await logAdmin(admin, "ai_settings", "service", "ai", "AI ayarı silindi");
    revalidatePath("/admin/settings");
    return { ok: true };
  }
  if (!AI_PROVIDERS.includes(provider)) return { error: "Təminatçı seçin" };
  if (!settingsReady()) return { error: STALE_CLIENT };
  const previous = await getStoredAi();
  const typed = String(form.get("apiKey") ?? "").trim().replace(/^["']|["']$/g, "");
  // Boş buraxılıbsa, eyni təminatçının saxlanmış açarı qalır
  const apiKey = typed || (previous?.provider === provider ? previous.apiKey : undefined);
  if (provider !== "ollama" && (!apiKey || apiKey.length < 10)) return { error: "Açarı yapışdırın (ən azı 10 simvol)" };
  await saveStoredAi({ provider, apiKey: provider === "ollama" ? undefined : apiKey, model: String(form.get("model") ?? "").trim() || undefined });
  await logAdmin(admin, "ai_settings", "service", "ai", `təminatçı: ${provider}`);
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function testAi(): Promise<{ ok: boolean; message: string }> {
  await requireSuperAdmin();
  try {
    const reply = await pingAi();
    return { ok: true, message: `AI cavab verdi: “${reply}”` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "AI cavab vermədi" };
  }
}

// ---- Kampaniyalar (endirim kodları)

const couponInput = (form: FormData) => {
  const code = normalizeCode(String(form.get("code") ?? ""));
  const type = String(form.get("type") ?? "PERCENT") as "PERCENT" | "FIXED";
  const rawValue = Number(form.get("value"));
  const num = (name: string) => {
    const v = String(form.get(name) ?? "").trim();
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  };
  const date = (name: string) => {
    const v = String(form.get(name) ?? "").trim();
    return v ? new Date(v) : null;
  };
  const plans = form.getAll("plans").map(String).filter((p): p is "PRO" | "PRO_MAX" => p === "PRO" || p === "PRO_MAX");
  const monthsRaw = String(form.get("months") ?? "");

  if (!COUPON_RE.test(code)) return { error: "Kod 3-24 simvol olmalıdır: A-Z, 0-9, _ və -" };
  if (!["PERCENT", "FIXED"].includes(type)) return { error: "Endirim növü düzgün deyil" };
  if (!Number.isFinite(rawValue) || rawValue <= 0) return { error: "Endirim dəyəri sıfırdan böyük olmalıdır" };
  if (type === "PERCENT" && rawValue > 100) return { error: "Faiz 100-dən böyük ola bilməz" };

  const startsAt = date("startsAt");
  const endsAt = date("endsAt");
  if (startsAt && endsAt && endsAt < startsAt) return { error: "Bitmə tarixi başlama tarixindən əvvəl ola bilməz" };

  return {
    data: {
      code,
      type,
      // Faiz olduğu kimi, sabit məbləğ qəpiyə çevrilir
      value: type === "PERCENT" ? Math.floor(rawValue) : Math.round(rawValue * 100),
      plans,
      months: monthsRaw === "1" || monthsRaw === "12" ? Number(monthsRaw) : null,
      maxUses: num("maxUses"),
      maxUsesPerUser: num("maxUsesPerUser"),
      startsAt,
      endsAt,
      note: String(form.get("note") ?? "").trim() || null,
    },
  };
};

export async function createCoupon(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = couponInput(form);
  if ("error" in parsed) return { error: parsed.error };
  const exists = await db.coupon.findUnique({ where: { code: parsed.data.code }, select: { id: true } });
  if (exists) return { error: "Bu kod artıq mövcuddur" };

  await db.coupon.create({ data: { ...parsed.data, createdBy: admin.email } });
  await logAdmin(admin, "coupon_create", "coupon", parsed.data.code, `${parsed.data.type} ${parsed.data.value}`);
  revalidatePath("/admin/campaigns");
  return { ok: true };
}

export async function updateCoupon(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const parsed = couponInput(form);
  if ("error" in parsed) return { error: parsed.error };
  const current = await db.coupon.findUnique({ where: { id } });
  if (!current) return { error: "Kod tapılmadı" };
  if (current.code !== parsed.data.code) {
    const taken = await db.coupon.findUnique({ where: { code: parsed.data.code }, select: { id: true } });
    if (taken) return { error: "Bu kod artıq mövcuddur" };
  }
  await db.coupon.update({ where: { id }, data: parsed.data });
  await logAdmin(admin, "coupon_update", "coupon", parsed.data.code, `${parsed.data.type} ${parsed.data.value}`);
  revalidatePath("/admin/campaigns");
  return { ok: true };
}

export async function toggleCoupon(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const coupon = await db.coupon.findUnique({ where: { id } });
  if (!coupon) return { error: "Kod tapılmadı" };
  await db.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
  await logAdmin(admin, "coupon_toggle", "coupon", coupon.code, coupon.isActive ? "deaktiv" : "aktiv");
  revalidatePath("/admin/campaigns");
  return { ok: true };
}

export async function deleteCoupon(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const coupon = await db.coupon.findUnique({ where: { id }, select: { code: true, usedCount: true } });
  if (!coupon) return { error: "Kod tapılmadı" };
  // İstifadə olunmuş kod silinmir: hesabat və ödəniş tarixçəsi qalmalıdır
  if (coupon.usedCount > 0) return { error: "İstifadə olunmuş kod silinmir — onu deaktiv edin" };
  await db.coupon.delete({ where: { id } });
  await logAdmin(admin, "coupon_delete", "coupon", coupon.code, null);
  revalidatePath("/admin/campaigns");
  return { ok: true };
}

// ---- Rəy moderasiyası

export async function toggleReviewVisibility(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const reason = String(form.get("reason") ?? "").trim().slice(0, 200);
  const review = await db.review.findUnique({ where: { id }, select: { id: true, hidden: true, profileId: true, profile: { select: { username: true } } } });
  if (!review) return { error: "Rəy tapılmadı" };

  await db.review.update({
    where: { id },
    data: review.hidden ? { hidden: false, hiddenReason: null } : { hidden: true, hiddenReason: reason || "Qaydalara uyğun deyil" },
  });
  // Gizlədilən rəy reytinqdən çıxır
  await refreshRating(review.profileId);
  await logAdmin(admin, review.hidden ? "review_show" : "review_hide", "service", id, review.profile.username);
  revalidatePath("/admin/reviews");
  revalidatePath(`/${review.profile.username}`);
  return { ok: true };
}
