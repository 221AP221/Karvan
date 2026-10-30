import type { Metadata } from "next";
import { Download } from "lucide-react";
import { FilterBar } from "@/components/FilterBar";
import { requireAdmin } from "@/lib/admin";
import { flat, usersWhere } from "@/lib/admin-queries";
import { db } from "@/lib/db";
import { type SearchParams, param } from "@/lib/search-params";
import { Pager, PageTitle, date, hrefWith } from "../ui";
import { UsersTable } from "./UsersTable";

export const metadata: Metadata = { title: "İstifadəçilər" };

const PAGE = 30;

export default async function AdminUsers({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(param(sp, "page")) || 1);

  const where = usersWhere(flat(sp));


  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        blockedAt: true,
        createdAt: true,
        subscription: { select: { plan: true } },
        profile: { select: { username: true, displayName: true, _count: { select: { services: true, invoices: true, orders: true } } } },
      },
    }),
  ]);

  return (
    <div>
      <PageTitle title="İstifadəçilər" text="Sətirdəki düymələrlə tarifi qaldırın/salın, bloklayın və ya dəyişin; bir neçəsini seçib toplu əməliyyat edin">
        <a href={hrefWith("/api/admin/export", { ...sp, type: "users" }, { page: null })} className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:border-gray-500">
          <Download size={15} aria-hidden /> Excel-ə ixrac
        </a>
      </PageTitle>
      {param(sp, "deleted") === "1" && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Hesab silindi.</p>}
      <FilterBar
        total={total}
        fields={[
          { type: "search", name: "q", placeholder: "Ad, e-poçt, telefon və ya səhifə ünvanı..." },
          { type: "select", name: "plan", label: "Plan", options: [{ value: "", label: "Plan: hamısı" }, { value: "FREE", label: "Pulsuz" }, { value: "PRO", label: "Pro" }, { value: "PRO_MAX", label: "Pro Max" }] },
          { type: "select", name: "status", label: "Status", options: [{ value: "", label: "Status: hamısı" }, { value: "active", label: "Aktiv" }, { value: "blocked", label: "Bloklanıb" }, { value: "admin", label: "Admin" }] },
        ]}
      />
      <UsersTable
        rows={users.map((u) => ({
          id: u.id,
          name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.profile?.displayName || "—",
          email: u.email ?? "",
          username: u.profile?.username ?? null,
          plan: u.subscription?.plan ?? "FREE",
          services: u.profile?._count.services ?? 0,
          orders: u.profile?._count.orders ?? 0,
          invoices: u.profile?._count.invoices ?? 0,
          blocked: Boolean(u.blockedAt),
          admin: u.role !== "USER",
          created: date(u.createdAt),
        }))}
      />
      <Pager page={page} pages={Math.ceil(total / PAGE)} href={(n) => hrefWith("/admin/users", sp, { page: n > 1 ? String(n) : null })} />
    </div>
  );
}
