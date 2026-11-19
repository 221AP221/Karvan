import { AlertTriangle, CheckCircle2, Sparkles, Users, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAiConfig } from "@/lib/ai-settings";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { PLAN_LIMITS, PLAN_NAMES, startOfMonth } from "@/lib/plans";
import { Badge, Kpi, PageTitle, card, td, th } from "../ui";

export const metadata: Metadata = { title: "AI istifadəsi" };

const TASK_LABELS: Record<string, string> = {
  "parse-invoice": "Faktura mətnindən doldurma",
  "describe-service": "Xidmət təsviri",
  theme: "Rəng/tema təklifi",
  analytics: "Analitika təhlili",
  reminder: "Ödəniş xatırlatması",
};

export default async function AdminAiUsage() {
  await requireAdmin();
  const monthStart = startOfMonth();

  const [config, totalThisMonth, byTask, byUser, last24h] = await Promise.all([
    getAiConfig(),
    db.activityLog.count({ where: { action: "ai_request", createdAt: { gte: monthStart } } }),
    db.activityLog.groupBy({ by: ["details"], where: { action: "ai_request", createdAt: { gte: monthStart } }, _count: true }),
    db.activityLog.groupBy({ by: ["userId"], where: { action: "ai_request", createdAt: { gte: monthStart }, userId: { not: null } }, _count: true, orderBy: { _count: { userId: "desc" } }, take: 30 }),
    // Son 24 saatlıq həcm: ani bir artım/dayanma olubsa tez görünsün
    db.activityLog.count({ where: { action: "ai_request", createdAt: { gte: new Date(Date.now() - 86_400_000) } } }),
  ]);

  const userIds = byUser.map((u) => u.userId).filter((x): x is string => Boolean(x));
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, firstName: true, lastName: true, subscription: { select: { plan: true } }, profile: { select: { username: true, displayName: true } } },
  });
  const usersById = new Map(users.map((u) => [u.id, u]));
  const rows = byUser
    .map((u) => ({ count: u._count, user: u.userId ? usersById.get(u.userId) : undefined }))
    .filter((r) => r.user);

  const configLabel = !config ? null : config.kind === "anthropic" ? "Claude" : `${config.name} · ${config.model}`;

  return (
    <div>
      <PageTitle icon={Sparkles} title="AI istifadəsi" text="Satıcıların faktura, təsvir, tema və analitika köməkçisindən istifadəsi" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={config ? CheckCircle2 : AlertTriangle}
          label="Təminatçı"
          value={configLabel ?? "Qoşulmayıb"}
          tone={config ? "money" : "danger"}
          href="/admin/settings"
          hint={config ? undefined : "Parametrlər → AI bölməsində açar yazın"}
        />
        <Kpi icon={Zap} label="Bu ay (cəmi sorğu)" value={String(totalThisMonth)} tone="brand" />
        <Kpi icon={Users} label="Aktiv istifadəçi (bu ay)" value={String(rows.length)} tone="violet" />
        <Kpi icon={Zap} label="Son 24 saat" value={String(last24h)} tone="info" />
      </div>

      {byTask.length > 0 && (
        <section className={`${card} mt-4 p-5`}>
          <h2 className="mb-3 font-semibold">Əməliyyat növü üzrə (bu ay)</h2>
          <div className="flex flex-wrap gap-2">
            {byTask
              .sort((a, b) => b._count - a._count)
              .map((t) => (
                <span key={t.details} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs">
                  <span className="font-medium">{TASK_LABELS[t.details ?? ""] ?? t.details ?? "naməlum"}</span>
                  <span className="tabular-nums text-gray-500">{t._count}</span>
                </span>
              ))}
          </div>
        </section>
      )}

      <section className={`${card} mt-4 overflow-x-auto`}>
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="font-semibold">Ən çox istifadə edənlər (bu ay)</h2>
        </div>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-t border-gray-100">
              <th className={th}>Satıcı</th>
              <th className={th}>Plan</th>
              <th className={th}>İstifadə</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ count, user }) => {
              const plan = user!.subscription?.plan ?? "FREE";
              const limit = PLAN_LIMITS[plan].aiRequestsPerMonth;
              const pctUsed = limit === Infinity ? 0 : Math.min(100, Math.round((count / limit) * 100));
              const near = limit !== Infinity && pctUsed >= 80;
              return (
                <tr key={user!.id} className="border-t border-gray-100">
                  <td className={td}>
                    <Link href={`/admin/users/${user!.id}`} prefetch={false} className="font-medium hover:underline">
                      {user!.profile?.displayName || [user!.firstName, user!.lastName].filter(Boolean).join(" ") || user!.email}
                    </Link>
                    <span className="block text-xs text-gray-500">{user!.email}</span>
                  </td>
                  <td className={td}>{PLAN_NAMES[plan]}</td>
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums">
                        {count} {limit !== Infinity && <span className="text-gray-400">/ {limit}</span>}
                      </span>
                      {limit !== Infinity && (
                        <div className="h-1.5 w-20 rounded-full bg-gray-100">
                          <div className={`h-1.5 rounded-full ${near ? "bg-amber-500" : "bg-gray-400"}`} style={{ width: `${pctUsed}%` }} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={`${td} text-right`}>{near && <Badge tone="warning">limitə yaxın</Badge>}</td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td className={`${td} text-center text-gray-500`} colSpan={4}>
                  Bu ay heç bir sorğu olmayıb.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
