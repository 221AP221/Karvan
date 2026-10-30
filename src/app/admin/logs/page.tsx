import { Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { ACTIVITY_GROUPS, ACTIVITY_LABELS } from "@/lib/activity";
import { requireAdmin } from "@/lib/admin";
import { activityWhere, adminLogWhere, flat } from "@/lib/admin-queries";
import { db } from "@/lib/db";
import { type SearchParams, param } from "@/lib/search-params";
import { ACTION_LABELS, Pager, PageTitle, card, dateTime, hrefWith, td, th } from "../ui";

export const metadata: Metadata = { title: "Jurnal" };

const PAGE = 50;
const WARN = new Set(["login_failed", "login_blocked", "account_delete"]);

export default async function AdminLogs({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = param(sp, "tab") === "admin" ? "admin" : "activity";
  const page = Math.max(1, Number(param(sp, "page")) || 1);
  const p = flat(sp);
  const userId = param(sp, "user");
  const forUser = userId ? await db.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true, lastName: true } }) : null;

  const [activityTotal, adminTotal] = await Promise.all([db.activityLog.count({ where: activityWhere(p) }), db.adminLog.count({ where: adminLogWhere(p) })]);
  const total = tab === "admin" ? adminTotal : activityTotal;

  const activity = tab === "activity" ? await db.activityLog.findMany({ where: activityWhere(p), orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }) : [];
  const adminLogs = tab === "admin" ? await db.adminLog.findMany({ where: adminLogWhere(p), orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }) : [];

  // Mövcud istifadəçilərə link (silinmiş hesabların qeydləri qalır, amma linksiz)
  const ids = [...activity.map((a) => a.userId), ...adminLogs.filter((l) => l.targetType === "user").map((l) => l.targetId)].filter((x): x is string => Boolean(x));
  const existing = new Set((await db.user.findMany({ where: { id: { in: ids } }, select: { id: true } })).map((u) => u.id));

  const tabLink = (t: string, label: string, count: number) => (
    <Link
      href={hrefWith("/admin/logs", sp, { tab: t === "activity" ? null : t, page: null, action: null })}
      aria-current={tab === t ? "page" : undefined}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${tab === t ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
    >
      {label} <span className={`ml-1 tabular-nums ${tab === t ? "text-white/60" : "text-gray-400"}`}>{count}</span>
    </Link>
  );

  const actionOptions =
    tab === "admin"
      ? Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }))
      : Object.entries(ACTIVITY_GROUPS).flatMap(([group, keys]) => keys.map((k) => ({ value: k, label: `${group}: ${ACTIVITY_LABELS[k]}` })));

  return (
    <div>
      <PageTitle title="Jurnal" text="İstifadəçilərin fəaliyyəti və adminlərin etdiyi dəyişikliklər">
        <a href={hrefWith("/api/admin/export", { ...sp, type: tab === "admin" ? "admin" : "activity" }, { page: null, tab: null })} className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:border-gray-500">
          <Download size={15} aria-hidden /> Excel-ə ixrac
        </a>
      </PageTitle>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabLink("activity", "İstifadəçi fəaliyyəti", activityTotal)}
        {tabLink("admin", "Admin əməliyyatları", adminTotal)}
        {forUser && (
          <span className="ml-2 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-sm text-violet-800">
            {[forUser.firstName, forUser.lastName].filter(Boolean).join(" ") || forUser.email}
            <Link href={hrefWith("/admin/logs", sp, { user: null, page: null })} className="font-semibold" aria-label="Filtri götür">
              ×
            </Link>
          </span>
        )}
      </div>

      <FilterBar
        total={total}
        fields={[
          { type: "search", name: "q", placeholder: tab === "admin" ? "Admin e-poçtu və ya ətraflı..." : "E-poçt, ətraflı və ya IP..." },
          { type: "select", name: "action", label: "Əməliyyat", options: [{ value: "", label: "Əməliyyat: hamısı" }, ...actionOptions] },
          { type: "date", name: "from", label: "Başlanğıc" },
          { type: "date", name: "to", label: "Son" },
        ]}
      />

      <div className={`${card} overflow-x-auto`}>
        {tab === "activity" ? (
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className={th}>Vaxt</th>
                <th className={th}>İstifadəçi</th>
                <th className={th}>Əməliyyat</th>
                <th className={th}>Ətraflı</th>
                <th className={th}>IP</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((a) => (
                <tr key={a.id} className={`border-t border-gray-100 ${WARN.has(a.action) ? "bg-red-50/50" : ""}`}>
                  <td className={`${td} whitespace-nowrap text-xs tabular-nums text-gray-500`}>{dateTime(a.createdAt)}</td>
                  <td className={td}>
                    {a.userId && existing.has(a.userId) ? (
                      <Link href={`/admin/users/${a.userId}`} className="hover:underline">
                        {a.email ?? a.userId}
                      </Link>
                    ) : (
                      <span className="text-gray-500">{a.email ?? "—"}</span>
                    )}
                  </td>
                  <td className={`${td} font-medium ${WARN.has(a.action) ? "text-red-700" : ""}`}>{ACTIVITY_LABELS[a.action] ?? a.action}</td>
                  <td className={`${td} max-w-xs truncate text-gray-600`} title={a.details ?? undefined}>
                    {a.details ?? "—"}
                  </td>
                  <td className={`${td} font-mono text-xs text-gray-500`}>{a.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className={th}>Vaxt</th>
                <th className={th}>Admin</th>
                <th className={th}>Əməliyyat</th>
                <th className={th}>Ətraflı</th>
              </tr>
            </thead>
            <tbody>
              {adminLogs.map((l) => (
                <tr key={l.id} className="border-t border-gray-100">
                  <td className={`${td} whitespace-nowrap text-xs tabular-nums text-gray-500`}>{dateTime(l.createdAt)}</td>
                  <td className={td}>{l.adminEmail}</td>
                  <td className={`${td} font-medium`}>
                    {l.targetType === "user" && existing.has(l.targetId) ? (
                      <Link href={`/admin/users/${l.targetId}`} className="hover:underline">
                        {ACTION_LABELS[l.action] ?? l.action}
                      </Link>
                    ) : (
                      (ACTION_LABELS[l.action] ?? l.action)
                    )}
                  </td>
                  <td className={`${td} text-gray-600`}>{l.details ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!(tab === "admin" ? adminLogs : activity).length && <p className="p-8 text-center text-sm text-gray-500">Qeyd tapılmadı.</p>}
      </div>
      <Pager page={page} pages={Math.ceil(total / PAGE)} href={(n) => hrefWith("/admin/logs", sp, { page: n > 1 ? String(n) : null })} />
    </div>
  );
}
