import { getCurrentProfile } from "@/lib/auth";
import { PERIODS, buildReport, type Period } from "@/lib/analytics-report";
import { PLAN_LIMITS } from "@/lib/plans";
import { can } from "@/lib/team";

const cell = (v: string | number) => {
  const s = String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const money = (q: number) => (q / 100).toFixed(2);

// Pro Max: analitika hesabatı CSV (Excel-də açılır; ; ayırıcı və BOM Excel-in Azərbaycan hərflərini düzgün oxuması üçündür)
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return new Response("Unauthorized", { status: 401 });
  // Komanda üzvü analitika səhifəsini görmürsə, bu endpoint-dən də çıxarmamalı (icazə matrisi)
  if (!can(profile.role, "analytics")) return new Response("İcazəniz yoxdur", { status: 403 });
  if (!PLAN_LIMITS[profile.user.subscription?.plan ?? "FREE"].reports) return new Response("Pro Max tələb olunur", { status: 403 });

  const raw = Number(new URL(request.url).searchParams.get("p"));
  const period: Period = (PERIODS as readonly number[]).includes(raw) ? (raw as Period) : 30;
  const r = await buildReport(profile.id, period);

  const rows: (string | number)[][] = [
    [`Karvan hesabatı: ${profile.displayName}`, `son ${period} gün`],
    [],
    ["Göstərici", "Dəyər"],
    ["Gəlir (AZN)", money(r.sales.revenueAzn)],
    ["Sifarişlər", r.sales.orders],
    ["Orta çek (AZN)", money(r.sales.avgOrder)],
    ["Ödənilmə dərəcəsi %", r.sales.paidRate?.toFixed(1) ?? ""],
    ["Unikal ziyarətçi", r.audience.visitors],
    ["Baxışlar", r.audience.views],
    ["Konversiya %", r.audience.conversion?.toFixed(2) ?? ""],
    ["Zəng klikləri", r.audience.phoneClicks],
    [],
    ["Tarix", "Ziyarətçi", "Baxış", "Sifariş", "Gəlir (AZN)"],
    ...r.buckets.map((b) => [b.label, b.visitors, b.views, b.orders, money(b.revenue)]),
    [],
    ["Mənbə", "Ziyarətçi", "Sifariş", "Gəlir (AZN)"],
    ...r.sources.map((s) => [s.label, s.visitors, s.orders, money(s.revenue)]),
    [],
    ["Xidmət", "Forma açılıb", "Sifariş", "Gəlir (AZN)"],
    ...r.topServices.map((s) => [s.title, s.opens, s.orders, money(s.revenue)]),
  ];
  const csv = "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="karvan-hesabat-${period}-gun.csv"`,
    },
  });
}
