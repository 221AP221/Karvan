import { AlertTriangle, Bell, CheckCircle2, Clock, MailWarning } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { CHANNEL_LABELS, EVENT_LABELS, STATUS_LABELS, channelReady } from "@/lib/notifications";
import { FilterBar } from "@/components/FilterBar";
import { Badge, Kpi, Pager, PageTitle, card, dateTime, hrefWith, td, th } from "../ui";

export const metadata: Metadata = { title: "Bildirişlər" };

const STATUS_TONE = { QUEUED: "info", SENT: "success", FAILED: "danger", SKIPPED: "neutral" } as const;
const PAGE_SIZE = 40;
const DAY = 86_400_000;

export default async function AdminNotifications({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const channel = typeof sp.channel === "string" ? sp.channel : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where = {
    ...(["QUEUED", "SENT", "FAILED", "SKIPPED"].includes(status) && { status: status as "QUEUED" | "SENT" | "FAILED" | "SKIPPED" }),
    ...(["EMAIL", "SMS", "PUSH"].includes(channel) && { channel: channel as "EMAIL" | "SMS" | "PUSH" }),
  };

  const [total, rows, byStatus, byChannel24h] = await Promise.all([
    db.notification.count({ where }),
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        event: true,
        channel: true,
        status: true,
        mode: true,
        target: true,
        error: true,
        createdAt: true,
        sentAt: true,
        profile: { select: { username: true, displayName: true, userId: true } },
      },
    }),
    db.notification.groupBy({ by: ["status"], where: { createdAt: { gte: new Date(Date.now() - 7 * DAY) } }, _count: true }),
    db.notification.groupBy({ by: ["channel", "status"], where: { createdAt: { gte: new Date(Date.now() - DAY) } }, _count: true }),
  ]);

  const count = (s: string) => byStatus.find((r) => r.status === s)?._count ?? 0;
  const sent7d = count("SENT");
  const failed7d = count("FAILED");
  const skipped7d = count("SKIPPED");
  const deliveryRate = sent7d + failed7d ? Math.round((sent7d / (sent7d + failed7d)) * 100) : null;

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (n: number) => hrefWith("/admin/notifications", sp, { page: n > 1 ? String(n) : null });

  return (
    <div>
      <PageTitle icon={Bell} title="Bildirişlər" text="Platformada göndərilən e-poçt/SMS/push bildirişlərinin sağlamlığı" />

      {!channelReady("EMAIL") && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <MailWarning size={18} className="mt-0.5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">E-poçt provayderi qoşulmayıb</p>
            <p className="mt-0.5 text-amber-800">
              RESEND_API_KEY / EMAIL_FROM yazılmayıb: bütün e-poçt bildirişləri “Kanal qoşulmayıb” statusu ilə növbədə qalır. SMS/push ümumiyyətlə hələ dəstəklənmir (IR-03).
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={CheckCircle2} label="Göndərilib (7 gün)" value={String(sent7d)} tone="money" hint={deliveryRate !== null ? `${deliveryRate}% çatdırılma faizi` : undefined} />
        <Kpi icon={AlertTriangle} label="Alınmayıb (7 gün)" value={String(failed7d)} tone="danger" />
        <Kpi icon={Clock} label="Kanal qoşulmayıb (7 gün)" value={String(skipped7d)} tone="warn" />
        <Kpi icon={Bell} label="Cəmi (bu səhifədə)" value={String(total)} tone="info" />
      </div>

      {byChannel24h.length > 0 && (
        <section className={`${card} mt-4 p-5`}>
          <h2 className="mb-3 font-semibold">Son 24 saat, kanal üzrə</h2>
          <div className="flex flex-wrap gap-2">
            {byChannel24h.map((r) => (
              <span key={`${r.channel}-${r.status}`} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs">
                <span className="font-medium">{CHANNEL_LABELS[r.channel]}</span>
                <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                <span className="tabular-nums text-gray-500">{r._count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="mt-4">
        <FilterBar
          total={total}
          fields={[
            { type: "select", name: "status", label: "Status", options: (["QUEUED", "SENT", "FAILED", "SKIPPED"] as const).map((s) => ({ value: s, label: STATUS_LABELS[s] })) },
            { type: "select", name: "channel", label: "Kanal", options: (["EMAIL", "SMS", "PUSH"] as const).map((c) => ({ value: c, label: CHANNEL_LABELS[c] })) },
          ]}
        />
      </div>

      <section className={`${card} mt-4 overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className={th}>Satıcı</th>
              <th className={th}>Hadisə</th>
              <th className={th}>Kanal</th>
              <th className={th}>Status</th>
              <th className={th}>Səbəb</th>
              <th className={`${th} text-right`}>Tarix</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => (
              <tr key={n.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                <td className={td}>
                  <Link href={`/admin/users/${n.profile.userId}`} prefetch={false} className="font-medium hover:underline">
                    {n.profile.displayName}
                  </Link>
                  <span className="block text-xs text-gray-500">@{n.profile.username}</span>
                </td>
                <td className={td}>{EVENT_LABELS[n.event]}</td>
                <td className={td}>
                  {CHANNEL_LABELS[n.channel]} <span className="text-xs text-gray-400">· {n.mode === "AUTO" ? "avtomatik" : "manual"}</span>
                </td>
                <td className={td}>
                  <Badge tone={STATUS_TONE[n.status]}>{STATUS_LABELS[n.status]}</Badge>
                </td>
                <td className={`${td} max-w-xs truncate text-xs text-gray-500`} title={n.error ?? n.target ?? undefined}>
                  {n.error ?? n.target ?? "—"}
                </td>
                <td className={`${td} text-right text-xs text-gray-500`}>{dateTime(n.sentAt ?? n.createdAt)}</td>
              </tr>
            ))}
            {!rows.length && (
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
