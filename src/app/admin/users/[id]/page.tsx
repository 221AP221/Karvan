import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { secondaryButtonClass } from "@/components/ui";
import { ACTIVITY_LABELS } from "@/lib/activity";
import { maskDocument, requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/invoice-status";
import { formatMoney } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { categoryLabel } from "@/lib/services";
import { impersonate, setRole, setServiceBlocked, unblockUser } from "../../actions";
import { ROLE_LABELS, STATUS_LABELS as MEMBER_STATUS_LABELS } from "@/lib/team";
import { ACTION_LABELS, Badge, PageTitle, PlanBadge, StatusBadge, card, date, dateTime, td, th } from "../../ui";
import { BlockForm, DeleteForm, EditForm, PasswordAdminForm, PlanForm } from "./forms";
import { QuickActions } from "./QuickActions";

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

  const [paid, logs, activity, members] = await Promise.all([
    user.profile ? db.invoice.groupBy({ by: ["currency"], where: { profileId: user.profile.id, status: "PAID" }, _sum: { totalQepik: true } }) : [],
    db.adminLog.findMany({ where: { targetId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.activityLog.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 40 }),
    user.profile
      ? db.membership.findMany({
          where: { profileId: user.profile.id, role: { not: "OWNER" } },
          orderBy: [{ status: "asc" }, { invitedAt: "desc" }],
          select: { id: true, role: true, status: true, invitedEmail: true, acceptedAt: true, invitedAt: true, user: { select: { firstName: true, lastName: true, email: true } } },
        })
      : [],
  ]);
  // İstifadəçinin öz fəaliyyəti və adminlərin ona etdiyi dəyişikliklər bir zaman xəttində
  const timeline = [
    ...activity.map((a) => ({ id: a.id, at: a.createdAt, admin: false, label: ACTIVITY_LABELS[a.action] ?? a.action, details: a.details, meta: a.ip, warn: a.action === "login_failed" || a.action === "login_blocked" })),
    ...logs.map((l) => ({ id: l.id, at: l.createdAt, admin: true, label: ACTION_LABELS[l.action] ?? l.action, details: l.details, meta: l.adminEmail, warn: false })),
  ]
    .sort((x, y) => y.at.getTime() - x.at.getTime())
    .slice(0, 40);
  const p = user.profile;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || p?.displayName || user.email;
  const isSelf = user.id === admin.id;
  const isAdmin = user.role !== "USER";

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

      <QuickActions userId={user.id} plan={user.subscription?.plan ?? "FREE"} blocked={Boolean(user.blockedAt)} protectedUser={isAdmin || isSelf} sessions={user._count.sessions} />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px] [&>*]:min-w-0">
        <div className="flex flex-col gap-4">
          <section className={`${card} p-5`}>
            <h2 className="mb-2 font-semibold">Məlumat</h2>
            <dl>
              <Row label="Ad, soyad">{[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}</Row>
              <Row label="Telefon">{user.phone ? formatPhone(user.phone) : "—"}</Row>
              <Row label="Vətəndaşlıq">{user.citizenship === "AZ" ? "Azərbaycan" : user.citizenship === "FOREIGN" ? "Xarici" : "—"}</Row>
              <Row label={user.citizenship === "FOREIGN" ? "Pasport" : "FİN kod"}>
                <span className="tabular-nums">{maskDocument(user.finCode ?? user.passportNumber)}</span>
              </Row>
              <Row label="Səhifə">{p ? `@${p.username} · ${p.displayName}` : "Profil yoxdur"}</Row>
              <Row label="Kataloqda">{p ? (p.showInCatalog ? "Görünür" : "Gizlədib") : "—"}</Row>
              <Row label="Qeydiyyat">{dateTime(user.createdAt)}</Row>
              <Row label="Açıq sessiya">{user._count.sessions}</Row>
            </dl>
          </section>

          <section id="duzelis" className={`${card} scroll-mt-6 p-5`}>
            <h2 className="mb-3 font-semibold">Məlumatları dəyiş</h2>
            <EditForm
              userId={user.id}
              hasProfile={Boolean(p)}
              values={{
                firstName: user.firstName ?? "",
                lastName: user.lastName ?? "",
                email: user.email ?? "",
                phone: user.phone ? formatPhone(user.phone) : "",
                username: p?.username ?? "",
                displayName: p?.displayName ?? "",
                profession: p?.profession ?? "",
                city: p?.city ?? "",
              }}
            />
          </section>

          {p && (
            <section className={`${card} p-5`}>
              <h2 className="mb-2 font-semibold">Statistika</h2>
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
                        <td className={`${td} tabular-nums text-xs`}>{i.number}</td>
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

          {p && members.length > 0 && (
            <section className={card}>
              <div className="flex items-center justify-between px-5 pt-5">
                <h2 className="font-semibold">Komanda ({members.length})</h2>
                <Link href={`/admin/team?q=${encodeURIComponent(p.username)}`} className="text-sm text-gray-500 hover:text-gray-900">
                  Komanda bölməsində →
                </Link>
              </div>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="border-t border-gray-100">
                    <th className={th}>Üzv</th>
                    <th className={th}>Rol</th>
                    <th className={th}>Status</th>
                    <th className={`${th} text-right`}>Tarix</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-t border-gray-100">
                      <td className={td}>
                        {[m.user?.firstName, m.user?.lastName].filter(Boolean).join(" ") || m.invitedEmail}
                        <span className="block text-xs text-gray-500">{m.user?.email ?? m.invitedEmail}</span>
                      </td>
                      <td className={td}>{ROLE_LABELS[m.role]}</td>
                      <td className={td}>
                        <Badge tone={m.status === "ACTIVE" ? "success" : m.status === "SUSPENDED" ? "neutral" : "warning"}>{MEMBER_STATUS_LABELS[m.status]}</Badge>
                      </td>
                      <td className={`${td} text-right text-xs text-gray-500`}>{date(m.acceptedAt ?? m.invitedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section id="fealiyyet" className={`${card} scroll-mt-6`}>
            <div className="flex items-center justify-between px-5 pt-5">
              <h2 className="font-semibold">Fəaliyyət və jurnal</h2>
              <Link href={`/admin/logs?tab=activity&user=${user.id}`} className="text-sm text-gray-500 hover:text-gray-900">
                Hamısı →
              </Link>
            </div>
            {timeline.length ? (
              <ol className="mt-3">
                {timeline.map((e) => (
                  <li key={e.id} className="flex gap-3 border-t border-gray-100 px-5 py-2.5 text-sm">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.admin ? "bg-gray-900" : e.warn ? "bg-red-500" : "bg-violet-500"}`} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p>
                        <span className="font-medium">{e.label}</span>
                        {e.admin && <span className="ml-1.5 rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">admin</span>}
                        {e.details && <span className="text-gray-600"> · {e.details}</span>}
                      </p>
                      <p className="text-xs text-gray-400">
                        {dateTime(e.at)}
                        {e.meta && ` · ${e.meta}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="p-5 text-sm text-gray-500">Hələ qeyd yoxdur.</p>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className={`${card} p-5`}>
            <h2 className="mb-1 font-semibold">Tarifi seç</h2>
            <p className="mb-3 text-xs text-gray-500">İstənilən tarifə birbaşa keçirmək üçün</p>
            <PlanForm userId={user.id} plan={user.subscription?.plan ?? "FREE"} />
          </section>

          {(!isAdmin || admin.role === "SUPER_ADMIN") && !isSelf && (
            <section className={`${card} p-5`}>
              <h2 className="mb-3 font-semibold">Şifrə</h2>
              <PasswordAdminForm userId={user.id} />
            </section>
          )}

          {admin.role === "SUPER_ADMIN" && !isSelf && (
            <section className={`${card} border-gray-900/20 p-5`}>
              <h2 className="mb-1 font-semibold">Super admin</h2>
              <p className="mb-3 text-xs text-gray-500">Rol dəyişəndə istifadəçi bütün cihazlardan çıxarılır.</p>
              <div className="flex flex-wrap gap-2">
                {(["USER", "ADMIN", "SUPER_ADMIN"] as const).map((r) => (
                  <form key={r} action={setRole.bind(null, user.id, r)}>
                    <button disabled={user.role === r} className={`rounded-full px-3 py-1.5 text-xs font-medium ${user.role === r ? "bg-gray-900 text-white" : "border border-gray-300 hover:border-gray-600"}`}>
                      {r === "USER" ? "İstifadəçi" : r === "ADMIN" ? "Admin" : "Super admin"}
                    </button>
                  </form>
                ))}
              </div>
              {p && !isAdmin && !user.blockedAt && (
                <form action={impersonate.bind(null, user.id)} className="mt-4 border-t border-gray-100 pt-4">
                  <button className="w-full rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">İstifadəçi kimi daxil ol</button>
                  <p className="mt-2 text-xs text-gray-500">Onun panelini onun gözü ilə görürsünüz (dəstək üçün). 2 saat etibarlıdır, jurnala yazılır.</p>
                </form>
              )}
            </section>
          )}

          {!isAdmin && !isSelf && (
            <>
              {!user.blockedAt && (
                <section id="bloklama" className={`${card} scroll-mt-6 p-5`}>
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

        </div>
      </div>
    </div>
  );
}
