import { UserPlus, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { ROLE_HINTS, ROLE_LABELS, STATUS_LABELS, teamLimit } from "@/lib/team";
import { PLAN_NAMES } from "@/lib/plans";
import { FilterBar } from "@/components/FilterBar";
import { Badge, Kpi, Pager, PageTitle, PlanBadge, card, date, hrefWith, td, th } from "../ui";
import { RemoveMemberButton } from "./ui";

export const metadata: Metadata = { title: "Komanda üzvləri" };

const STATUS_TONE = { INVITED: "warning", ACTIVE: "success", SUSPENDED: "neutral" } as const;
const PAGE_SIZE = 30;

export default async function AdminTeam({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where = {
    role: { not: "OWNER" as const },
    ...(q && {
      OR: [
        { invitedEmail: { contains: q, mode: "insensitive" as const } },
        { user: { firstName: { contains: q, mode: "insensitive" as const } } },
        { user: { lastName: { contains: q, mode: "insensitive" as const } } },
        { profile: { displayName: { contains: q, mode: "insensitive" as const } } },
        { profile: { username: { contains: q.toLowerCase() } } },
      ],
    }),
    ...(["INVITED", "ACTIVE", "SUSPENDED"].includes(status) && { status: status as "INVITED" | "ACTIVE" | "SUSPENDED" }),
  };

  const [total, members, sellersWithTeam, active, suspended, proMaxCount] = await Promise.all([
    db.membership.count({ where }),
    db.membership.findMany({
      where,
      orderBy: [{ status: "asc" }, { invitedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        role: true,
        status: true,
        invitedEmail: true,
        invitedAt: true,
        acceptedAt: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        profile: {
          select: { id: true, username: true, displayName: true, userId: true, user: { select: { subscription: { select: { plan: true } } } } },
        },
      },
    }),
    db.membership.groupBy({ by: ["profileId"], where: { role: { not: "OWNER" } }, _count: true }),
    db.membership.count({ where: { role: { not: "OWNER" }, status: "ACTIVE" } }),
    db.membership.count({ where: { role: { not: "OWNER" }, status: "SUSPENDED" } }),
    db.subscription.count({ where: { plan: "PRO_MAX" } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (n: number) => hrefWith("/admin/team", sp, { page: n > 1 ? String(n) : null });

  return (
    <div>
      <PageTitle icon={UsersRound} title="Komanda üzvləri" text="Pro Max tarifində sahibin yanına əlavə olunan üzvlər" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={UsersRound} label="Komandalı satıcı" value={String(sellersWithTeam.length)} hint={`${proMaxCount} Pro Max abunəçidən`} tone="violet" />
        <Kpi icon={UserPlus} label="Aktiv üzv" value={String(active)} tone="money" />
        <Kpi icon={UsersRound} label="Dondurulmuş üzv" value={String(suspended)} hint="Tarif Pro Max-dan düşəndə avtomatik" tone="neutral" />
        <Kpi icon={UsersRound} label="Cəmi dəvət/üzv" value={String(total)} tone="info" />
      </div>

      <div className="mt-4">
        <FilterBar
          total={total}
          fields={[
            { type: "search", name: "q", placeholder: "Üzv, e-poçt və ya satıcı axtar..." },
            {
              type: "select",
              name: "status",
              label: "Status",
              options: (["INVITED", "ACTIVE", "SUSPENDED"] as const).map((s) => ({ value: s, label: STATUS_LABELS[s] })),
            },
          ]}
        />
      </div>

      <section className={`${card} mt-4 overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className={th}>Üzv</th>
              <th className={th}>Satıcı (iş sahəsi)</th>
              <th className={th}>Rol</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right`}>Tarix</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                <td className={td}>
                  <span className="font-medium">{[m.user?.firstName, m.user?.lastName].filter(Boolean).join(" ") || m.invitedEmail}</span>
                  <span className="block text-xs text-gray-500">{m.user?.email ?? m.invitedEmail}</span>
                </td>
                <td className={td}>
                  {m.profile ? (
                    <Link href={`/admin/users/${m.profile.userId}`} prefetch={false} className="font-medium hover:underline">
                      {m.profile.displayName}
                    </Link>
                  ) : (
                    "—"
                  )}
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">@{m.profile?.username}</span>
                    {m.profile && <PlanBadge plan={m.profile.user.subscription?.plan ?? "FREE"} />}
                  </span>
                </td>
                <td className={td} title={ROLE_HINTS[m.role]}>
                  {ROLE_LABELS[m.role]}
                </td>
                <td className={td}>
                  <Badge tone={STATUS_TONE[m.status]}>{STATUS_LABELS[m.status]}</Badge>
                </td>
                <td className={`${td} text-right text-xs text-gray-500`}>{date(m.acceptedAt ?? m.invitedAt)}</td>
                <td className={`${td} text-right`}>
                  <RemoveMemberButton id={m.id} label={m.user?.email ?? m.invitedEmail} />
                </td>
              </tr>
            ))}
            {!members.length && (
              <tr>
                <td className={`${td} text-center text-gray-500`} colSpan={6}>
                  Heç bir nəticə yoxdur.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
      <div className="px-1">
        <Pager page={page} pages={pages} href={pageHref} />
      </div>
    </div>
  );
}
