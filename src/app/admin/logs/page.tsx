import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { type SearchParams, param } from "@/lib/search-params";
import { ACTION_LABELS, Pager, PageTitle, card, dateTime, hrefWith, td, th } from "../ui";

export const metadata: Metadata = { title: "Jurnal" };

const PAGE = 50;

export default async function AdminLogs({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(param(sp, "page")) || 1);
  const [total, logs] = await Promise.all([db.adminLog.count(), db.adminLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE })]);
  const userIds = logs.filter((l) => l.targetType === "user").map((l) => l.targetId);
  const existing = new Set((await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true } })).map((u) => u.id));

  return (
    <div>
      <PageTitle title="Jurnal" text="Adminlərin etdiyi bütün dəyişikliklər" />
      <div className={`${card} overflow-x-auto`}>
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
            {logs.map((l) => (
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
        {!logs.length && <p className="p-8 text-center text-sm text-gray-500">Hələ dəyişiklik yoxdur.</p>}
      </div>
      <Pager page={page} pages={Math.ceil(total / PAGE)} href={(n) => hrefWith("/admin/logs", sp, { page: n > 1 ? String(n) : null })} />
    </div>
  );
}
