import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { secondaryButtonClass } from "@/components/ui";
import { maskDocument, requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/invoice-status";
import { formatMoney } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { categoryLabel } from "@/lib/services";
import { endUserSessions, setServiceBlocked, unblockUser } from "../../actions";
import { ACTION_LABELS, PageTitle, PlanBadge, StatusBadge, card, date, dateTime, td, th } from "../../ui";
import { BlockForm, DeleteForm, PlanForm } from "./forms";

export const metadata: Metadata = { title: "İstifadəçi" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-t border-gray-100 py-2.5 text-sm first:border-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{children}</dd>
    </div>
  );
}

export default async function AdminUser({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    include: {
      subscription: true,
      profile: {
        include: {
          services: { orderBy: { position: "asc" } },
          invoices: { orderBy: { issuedAt: "desc" }, take: 8 },
          _count: { select: { orders: true, invoices: true, events: true } },
        },
      },
      _count: { select: { sessions: true } },
    },
  });
  if (!user) notFound();

  const [paid, logs] = await Promise.all([
    user.profile ? db.invoice.groupBy({ by: ["currency"], where: { profileId: user.profile.id, status: "PAID" }, _sum: { totalQepik: true } }) : [],
    db.adminLog.findMany({ where: { targetId: id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  const p = user.profile;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || p?.displayName || user.email;
  const isSelf = user.id === admin.id;
  const isAdmin = user.role === "ADMIN";

  return (
    <div>
      <Link href="/admin/users" className="mb-3 inline-block text-sm text-gray-500 hover:text-gray-900">
        ← İstifadəçilər
      </Link>
      <PageTitle title={name ?? "—"} text={user.email ?? undefined}>
        <div className="flex items-center gap-2">
          <PlanBadge plan={user.subscription?.plan ?? "FREE"} />
          <StatusBadge blocked={Boolean(user.blockedAt)} admin={isAdmin} />
          {p && (
            <Link href={`/${p.username}`} target="_blank" className={`${secondaryButtonClass} gap-1.5`}>
              Səhifəyə bax <ExternalLink size={14} aria-hidden />
            </Link>
          )}
        </div>
      </PageTitle>

      {user.blockedAt && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span>
            <strong>{dateTime(user.blockedAt)}</strong> bloklanıb. Səbəb: {user.blockReason ?? "—"}
          </span>
          <form action={unblockUser.bind(null, user.id)}>
            <button className="rounded-full bg-white px-4 py-2 font-medium text-red-800 ring-1 ring-red-200 hover:bg-red-100">Bloku götür</button>
          </form>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px] [&>*]:min-w-0">
        <div className="flex flex-col gap-4">
          <section className={`${card} p-5`}>
            <h2 className="mb-2 font-semibold">Məlumat</h2>
            <dl>
              <Row label="Ad, soyad">{[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}</Row>
              <Row label="Telefon">{user.phone ? formatPhone(user.phone) : "—"}</Row>
              <Row label="Vətəndaşlıq">{user.citizenship === "AZ" ? "Azərbaycan" : user.citizenship === "FOREIGN" ? "Xarici" : "—"}</Row>
              <Row label={user.citizenship === "FOREIGN" ? "Pasport" : "FİN kod"}>
                <span className="font-mono">{maskDocument(user.finCode ?? user.passportNumber)}</span>
              </Row>
              <Row label="Səhifə">{p ? `@${p.username} · ${p.displayName}` : "Profil yoxdur"}</Row>
              <Row label="Kataloqda">{p ? (p.showInCatalog ? "Görünür" : "Gizlədib") : "—"}</Row>
              <Row label="Qeydiyyat">{dateTime(user.createdAt)}</Row>
              <Row label="Açıq sessiya">{user._count.sessions}</Row>
            </dl>
          </section>

          {p && (
            <section className={`${card} p-5`}>
              <h2 className="mb-2 font-semibold">Fəaliyyət</h2>
              <dl>
                <Row label="Sifarişlər">{p._count.orders}</Row>
                <Row label="Fakturalar">{p._count.invoices}</Row>
                <Row label="Ödənilmiş (cəmi)">{paid.length ? paid.map((r) => formatMoney(r._sum.totalQepik ?? 0, r.currency)).join(" + ") : "—"}</Row>
                <Row label="Səhifə hadisələri">{p._count.events}</Row>
              </dl>
            </section>
          )}

          {p && (
            <section className={card}>
              <h2 className="px-5 pt-5 font-semibold">Xidmətlər ({p.services.length})</h2>
              <div className="overflow-x-auto">
                <table className="mt-3 w-full min-w-[520px] text-sm">
                  <tbody>
                    {p.services.map((s) => (
                      <tr key={s.id} className="border-t border-gray-100">
                        <td className={td}>
                          <span className="font-medium">{s.title}</span>
                          <span className="block text-xs text-gray-500">{categoryLabel(s.category) ?? "Kateqoriyasız"}</span>
                        </td>
                        <td className={`${td} tabular-nums`}>{s.priceType === "FIXED" && s.amountQepik !== null ? formatMoney(s.amountQepik, s.currency) : "Razılaşma ilə"}</td>
                        <td className={td}>
                          {s.blocked ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Bloklanıb</span>
                          ) : s.isActive ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Aktiv</span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Satıcı gizlədib</span>
                          )}
                        </td>
                        <td className={`${td} text-right`}>
                          <form action={setServiceBlocked.bind(null, s.id, !s.blocked)}>
                            <button className="text-xs font-medium text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline">{s.blocked ? "Bərpa et" : "Blokla"}</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!p.services.length && <p className="p-5 text-sm text-gray-500">Xidmət yoxdur.</p>}
            </section>
          )}

          {p && (
            <section className={card}>
              <h2 className="px-5 pt-5 font-semibold">Son fakturalar</h2>
              <div className="overflow-x-auto">
                <table className="mt-3 w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-t border-gray-100">
                      <th className={th}>Nömrə</th>
                      <th className={th}>Müştəri</th>
                      <th className={`${th} text-right`}>Məbləğ</th>
                      <th className={th}>Status</th>
                      <th className={`${th} text-right`}>Tarix</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {p.invoices.map((i) => (
                      <tr key={i.id} className="border-t border-gray-100">
                        <td className={`${td} font-mono text-xs`}>{i.number}</td>
                        <td className={td}>{i.customerName}</td>
                        <td className={`${td} text-right`}>{formatMoney(i.totalQepik, i.currency)}</td>
                        <td className={td}>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[i.status]}`}>{STATUS_LABEL[i.status]}</span>
                        </td>
                        <td className={`${td} text-right text-xs text-gray-500`}>{date(i.issuedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!p.invoices.length && <p className="p-5 text-sm text-gray-500">Faktura yoxdur.</p>}
            </section>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <section className={`${card} p-5`}>
            <h2 className="mb-3 font-semibold">Plan</h2>
            <PlanForm userId={user.id} plan={user.subscription?.plan ?? "FREE"} />
          </section>

          {!isAdmin && !isSelf && (
            <>
              <section className={`${card} p-5`}>
                <h2 className="mb-1 font-semibold">Sessiyalar</h2>
                <p className="mb-3 text-sm text-gray-500">{user._count.sessions} cihazda daxil olub</p>
                <form action={endUserSessions.bind(null, user.id)}>
                  <button disabled={!user._count.sessions} className={secondaryButtonClass}>
                    Bütün cihazlardan çıxart
                  </button>
                </form>
              </section>
              {!user.blockedAt && (
                <section className={`${card} p-5`}>
                  <h2 className="mb-3 font-semibold">Bloklama</h2>
                  <BlockForm userId={user.id} />
                </section>
              )}
              <section className={`${card} border-red-200 p-5`}>
                <h2 className="mb-3 font-semibold text-red-700">Hesabı sil</h2>
                <DeleteForm userId={user.id} email={user.email ?? ""} />
              </section>
            </>
          )}

          <section className={`${card} p-5`}>
            <h2 className="mb-3 font-semibold">Admin jurnalı</h2>
            {logs.length ? (
              <ul className="flex flex-col gap-2 text-sm">
                {logs.map((l) => (
                  <li key={l.id} className="border-t border-gray-100 pt-2 first:border-0 first:pt-0">
                    <span className="font-medium">{ACTION_LABELS[l.action] ?? l.action}</span> {l.details && <span className="text-gray-600">· {l.details}</span>}
                    <span className="block text-xs text-gray-400">
                      {dateTime(l.createdAt)} · {l.adminEmail}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Dəyişiklik yoxdur.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
