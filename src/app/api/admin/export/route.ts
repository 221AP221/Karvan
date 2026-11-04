import { ACTIVITY_LABELS } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { activityWhere, adminLogWhere, flat, paymentsWhere, usersWhere } from "@/lib/admin-queries";
import { db } from "@/lib/db";
import { PLAN_NAMES } from "@/lib/plans";

const MAX = 20_000;

const BILLING_STATUS: Record<string, string> = {
  PENDING: "Gözləyir",
  PAID: "Ödənilib",
  ACTIVATED: "Aktivləşdi",
  REJECTED: "Rədd edildi",
  FAILED: "Alınmadı",
};

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString().replace("T", " ").slice(0, 19) : String(v);
  // Excel düstur kimi icra etməsin (=, +, -, @ ilə başlayan dəyərlər)
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",;\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

function csv(name: string, rows: unknown[][]) {
  const body = "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="karvan-${name}-${stamp}.csv"`, "Cache-Control": "no-store" },
  });
}

// Admin ixracı: ekrandakı filtrlərlə eyni nəticə. FİN/pasport ixraca daxil edilmir.
export async function GET(request: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role === "USER") return new Response("Not found", { status: 404 });
  const p = flat(Object.fromEntries(new URL(request.url).searchParams));

  if (p.type === "users") {
    const users = await db.user.findMany({
      where: usersWhere(p),
      orderBy: { createdAt: "desc" },
      take: MAX,
      select: {
        email: true, firstName: true, lastName: true, phone: true, role: true, blockedAt: true, blockReason: true, createdAt: true,
        subscription: { select: { plan: true } },
        profile: { select: { username: true, displayName: true, city: true, _count: { select: { services: true, orders: true, invoices: true } } } },
      },
    });
    return csv("istifadeciler", [
      ["E-poçt", "Ad", "Soyad", "Telefon", "Səhifə", "Görünən ad", "Şəhər", "Tarif", "Rol", "Status", "Blok səbəbi", "Xidmət", "Sifariş", "Faktura", "Qeydiyyat"],
      ...users.map((u) => [
        u.email, u.firstName, u.lastName, u.phone, u.profile?.username, u.profile?.displayName, u.profile?.city,
        PLAN_NAMES[u.subscription?.plan ?? "FREE"], u.role === "SUPER_ADMIN" ? "Super admin" : u.role === "ADMIN" ? "Admin" : "İstifadəçi", u.blockedAt ? "Bloklanıb" : "Aktiv", u.blockReason,
        u.profile?._count.services ?? 0, u.profile?._count.orders ?? 0, u.profile?._count.invoices ?? 0, u.createdAt,
      ]),
    ]);
  }

  if (p.type === "payments") {
    const payments = await db.subscriptionPayment.findMany({
      where: paymentsWhere(p),
      orderBy: { createdAt: "desc" },
      take: MAX,
      include: { user: { select: { email: true, profile: { select: { username: true, displayName: true } } } } },
    });
    return csv("odenisler", [
      ["Tarix", "Ödəniş kodu", "E-poçt", "Səhifə", "Görünən ad", "Tarif", "Müddət (ay)", "Məbləğ (AZN)", "Üsul", "Status", "Provayder", "Xarici ID", "Ödənilib", "Aktivləşib", "Qeyd"],
      ...payments.map((x) => [
        x.createdAt, x.reference, x.user.email, x.user.profile?.username, x.user.profile?.displayName,
        PLAN_NAMES[x.plan], x.months, (x.amountQepik / 100).toFixed(2),
        x.method === "CARD" ? "Kart" : "Bank köçürməsi", BILLING_STATUS[x.status] ?? x.status,
        x.provider, x.externalId, x.paidAt, x.activatedAt, x.note,
      ]),
    ]);
  }

  if (p.type === "admin") {
    const logs = await db.adminLog.findMany({ where: adminLogWhere(p), orderBy: { createdAt: "desc" }, take: MAX });
    return csv("admin-jurnal", [["Vaxt", "Admin", "Əməliyyat", "Hədəf", "Hədəf ID", "Ətraflı"], ...logs.map((l) => [l.createdAt, l.adminEmail, l.action, l.targetType, l.targetId, l.details])]);
  }

  const logs = await db.activityLog.findMany({ where: activityWhere(p), orderBy: { createdAt: "desc" }, take: MAX });
  return csv("fealiyyet", [["Vaxt", "E-poçt", "Əməliyyat", "Ətraflı", "IP", "İstifadəçi ID"], ...logs.map((l) => [l.createdAt, l.email, ACTIVITY_LABELS[l.action] ?? l.action, l.details, l.ip, l.userId])]);
}
