import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { type SearchParams, param } from "@/lib/search-params";
import { Pager, PageTitle, PlanBadge, StatusBadge, card, date, hrefWith, td, th } from "../ui";

export const metadata: Metadata = { title: "İstifadəçilər" };

const PAGE = 30;

export default async function AdminUsers({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp, "q");
  const plan = param(sp, "plan");
  const status = param(sp, "status");
  const page = Math.max(1, Number(param(sp, "page")) || 1);

  const where: Prisma.UserWhereInput = {
    ...(q && {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q.replace(/\s/g, "") } },
        { profile: { username: { contains: q.toLowerCase() } } },
        { profile: { displayName: { contains: q, mode: "insensitive" } } },
      ],
    }),
    ...(["FREE", "PRO", "PRO_MAX"].includes(plan) && { subscription: { plan: plan as "FREE" | "PRO" | "PRO_MAX" } }),
    ...(status === "blocked" && { blockedAt: { not: null } }),
    ...(status === "active" && { blockedAt: null, role: "USER" }),
    ...(status === "admin" && { role: "ADMIN" }),
  };

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
      <PageTitle title="İstifadəçilər" text="Hesablar, planlar və moderasiya" />
      {param(sp, "deleted") === "1" && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Hesab silindi.</p>}
      <FilterBar
        total={total}
        fields={[
          { type: "search", name: "q", placeholder: "Ad, e-poçt, telefon və ya səhifə ünvanı..." },
          { type: "select", name: "plan", label: "Plan", options: [{ value: "", label: "Plan: hamısı" }, { value: "FREE", label: "Pulsuz" }, { value: "PRO", label: "Pro" }, { value: "PRO_MAX", label: "Pro Max" }] },
          { type: "select", name: "status", label: "Status", options: [{ value: "", label: "Status: hamısı" }, { value: "active", label: "Aktiv" }, { value: "blocked", label: "Bloklanıb" }, { value: "admin", label: "Admin" }] },
        ]}
      />
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>İstifadəçi</th>
              <th className={th}>Səhifə</th>
              <th className={th}>Plan</th>
              <th className={`${th} text-right`}>Xidmət</th>
              <th className={`${th} text-right`}>Sifariş</th>
              <th className={`${th} text-right`}>Faktura</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right`}>Qeydiyyat</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className={td}>
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-gray-900 hover:underline">
                    {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.profile?.displayName || "—"}
                  </Link>
                  <span className="block text-xs text-gray-500">{u.email}</span>
                </td>
                <td className={td}>
                  {u.profile ? (
                    <Link href={`/${u.profile.username}`} target="_blank" className="text-gray-600 hover:underline">
                      @{u.profile.username}
                    </Link>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className={td}>
                  <PlanBadge plan={u.subscription?.plan ?? "FREE"} />
                </td>
                <td className={`${td} text-right`}>{u.profile?._count.services ?? 0}</td>
                <td className={`${td} text-right`}>{u.profile?._count.orders ?? 0}</td>
                <td className={`${td} text-right`}>{u.profile?._count.invoices ?? 0}</td>
                <td className={td}>
                  <StatusBadge blocked={Boolean(u.blockedAt)} admin={u.role === "ADMIN"} />
                </td>
                <td className={`${td} text-right text-xs text-gray-500`}>{date(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length && <p className="p-8 text-center text-sm text-gray-500">Heç nə tapılmadı.</p>}
      </div>
      <Pager page={page} pages={Math.ceil(total / PAGE)} href={(n) => hrefWith("/admin/users", sp, { page: n > 1 ? String(n) : null })} />
    </div>
  );
}
