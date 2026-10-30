import { headers } from "next/headers";
import { db } from "@/lib/db";

// Fəaliyyət növləri və admin panelində göstərilən adları
export const ACTIVITY_LABELS: Record<string, string> = {
  signup: "Qeydiyyat",
  login: "Giriş",
  login_failed: "Uğursuz giriş",
  login_blocked: "Bloklanmış hesabla giriş cəhdi",
  logout: "Çıxış",
  password_reset_request: "Şifrə bərpası istədi",
  password_reset: "Şifrəni bərpa etdi",
  password_change: "Şifrəni dəyişdi",
  email_change: "E-poçtu dəyişdi",
  profile_update: "Profili yenilədi",
  payment_settings: "Rekvizitləri dəyişdi",
  catalog_visibility: "Kataloq görünüşünü dəyişdi",
  sessions_end: "Digər cihazlardan çıxdı",
  account_delete: "Hesabı sildi",
  service_create: "Xidmət yaratdı",
  service_update: "Xidməti dəyişdi",
  service_toggle: "Xidməti gizlətdi / göstərdi",
  service_delete: "Xidməti sildi",
  order_received: "Sifariş aldı",
  order_approve: "Sifarişi təsdiqlədi",
  order_reject: "Sifarişdən imtina etdi",
  invoice_create: "Faktura yaratdı",
  invoice_paid: "Faktura ödənildi",
  invoice_claimed: "Müştəri “Ödədim” basdı",
  invoice_cancel: "Fakturanı ləğv etdi",
  invoice_reopen: "Fakturanı bərpa etdi",
};

export const ACTIVITY_GROUPS: Record<string, string[]> = {
  "Giriş və təhlükəsizlik": ["signup", "login", "login_failed", "login_blocked", "logout", "password_reset_request", "password_reset", "password_change", "email_change", "sessions_end", "account_delete"],
  Profil: ["profile_update", "payment_settings", "catalog_visibility"],
  Xidmətlər: ["service_create", "service_update", "service_toggle", "service_delete"],
  "Sifariş və faktura": ["order_received", "order_approve", "order_reject", "invoice_create", "invoice_paid", "invoice_claimed", "invoice_cancel", "invoice_reopen"],
};

async function clientIp() {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  } catch {
    return null;
  }
}

// Qeyd heç vaxt əsas əməliyyatı pozmamalıdır: xəta olsa belə səssizcə keçir
export async function logActivity(entry: { userId?: string | null; email?: string | null; action: keyof typeof ACTIVITY_LABELS | string; details?: string | null }) {
  try {
    await db.activityLog.create({
      data: { userId: entry.userId ?? null, email: entry.email ?? null, action: entry.action, details: entry.details?.slice(0, 500) ?? null, ip: await clientIp() },
    });
  } catch (error) {
    console.error("activity log", error);
  }
}
