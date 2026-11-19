import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { type SearchParams, param } from "@/lib/search-params";
import { SERVICE_CATEGORIES, categoryLabel } from "@/lib/services";
import { setServiceBlocked } from "../actions";
import { Badge, Pager, PageTitle, card, hrefWith, td, th } from "../ui";

export const metadata: Metadata = { title: "Xidmətlər" };

const PAGE = 40;

export default async function AdminServices({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp, "q");
  const category = param(sp, "category");
  const status = param(sp, "status");
  const page = Math.max(1, Number(param(sp, "page")) || 1);

  const where: Prisma.ServiceWhereInput = {
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { profile: { username: { contains: q.toLowerCase() } } },
        { profile: { displayName: { contains: q, mode: "insensitive" } } },
      ],
    }),
    ...(category === "none" ? { category: null } : category && { category }),
    ...(status === "active" && { isActive: true, blocked: false }),
    ...(status === "hidden" && { isActive: false }),
    ...(status === "blocked" && { blocked: true }),
  };

  const [total, services] = await Promise.all([
    db.service.count({ where }),
    db.service.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: { profile: { select: { username: true, displayName: true, userId: true } }, _count: { select: { orders: true } } },
    }),
  ]);

  return (
    <div>
      <PageTitle title="Xidmətlər" text="Bütün satıcıların xidmətləri və moderasiya. Bloklanan xidmət səhifədə və kataloqda görünmür." />
      <FilterBar
        total={total}
        fields={[
          { type: "search", name: "q", placeholder: "Xidmət və ya satıcı..." },
          {
            type: "select",
            name: "category",
            label: "Sahə",
            options: [{ value: "", label: "Sahə: hamısı" }, ...SERVICE_CATEGORIES.map((c) => ({ value: c.key, label: c.label })), { value: "none", label: "Kateqoriyasız" }],
          },
          { type: "select", name: "status", label: "Status", options: [{ value: "", label: "Status: hamısı" }, { value: "active", label: "Aktiv" }, { value: "hidden", label: "Satıcı gizlədib" }, { value: "blocked", label: "Bloklanıb" }] },
        ]}
      />
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Xidmət</th>
              <th className={th}>Satıcı</th>
              <th className={`${th} text-right`}>Qiymət</th>
              <th className={`${th} text-right`}>Sifariş</th>
              <th className={th}>Status</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {services.map((s) => (
              <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className={td}>
                  <span className="font-medium">{s.title}</span>
                  <span className="block max-w-sm truncate text-xs text-gray-500">{categoryLabel(s.category) ?? "Kateqoriyasız"}{s.description ? ` · ${s.description}` : ""}</span>
                </td>
                <td className={td}>
                  <Link href={`/admin/users/${s.profile.userId}`} className="hover:underline">
                    {s.profile.displayName}
                  </Link>
                  <span className="block text-xs text-gray-500">@{s.profile.username}</span>
                </td>
                <td className={`${td} text-right`}>{s.priceType === "FIXED" && s.amountQepik !== null ? formatMoney(s.amountQepik, s.currency) : "Razılaşma ilə"}</td>
                <td className={`${td} text-right`}>{s._count.orders}</td>
                <td className={td}>
                  {s.blocked ? <Badge tone="danger">Bloklanıb</Badge> : s.isActive ? <Badge tone="success">Aktiv</Badge> : <Badge tone="neutral">Gizli</Badge>}
                </td>
                <td className={`${td} text-right`}>
                  <form action={setServiceBlocked.bind(null, s.id, !s.blocked)}>
                    <button className={`rounded-lg px-3 py-1.5 text-xs font-medium ${s.blocked ? "bg-gray-900 text-white hover:bg-gray-700" : "text-red-700 ring-1 ring-red-200 hover:bg-red-50"}`}>
                      {s.blocked ? "Bərpa et" : "Blokla"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!services.length && <p className="p-8 text-center text-sm text-gray-500">Heç nə tapılmadı.</p>}
      </div>
      <Pager page={page} pages={Math.ceil(total / PAGE)} href={(n) => hrefWith("/admin/services", sp, { page: n > 1 ? String(n) : null })} />
    </div>
  );
}
