import { Crown, Info, Mail, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requirePageAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLAN_NAMES } from "@/lib/plans";
import { ROLE_HINTS, ROLE_LABELS, STATUS_LABELS, teamLimit } from "@/lib/team";
import { InviteForm, MemberRow } from "./ui";

export const metadata: Metadata = { title: "Komanda" };

// Tarix server-də formatlanır: müştəri tərəfdə Intl saat qurşağı fərqi hidrasiya xətası verirdi.
const memberDate = (value: Date) =>
  new Intl.DateTimeFormat("az-AZ", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Baku" }).format(value);

export default async function TeamPage() {
  const profile = await requirePageAccess("team");
  const plan = profile.user.subscription?.plan ?? "FREE";
  const limit = teamLimit(plan);

  const members = await db.membership.findMany({
    where: { profileId: profile.id },
    orderBy: [{ role: "asc" }, { invitedAt: "asc" }],
    include: { user: { select: { email: true, firstName: true, lastName: true, lastSeenAt: true } } },
  });
  const used = members.filter((m) => m.status === "ACTIVE" || m.status === "INVITED").length;
  const canInvite = limit > 1 && used < limit;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Komanda</h1>
        <p className="text-sm text-gray-500">
          Səhifənizi bir neçə nəfərlə idarə edin. Abunəlik, ödəniş rekvizitləri və komanda idarəsi yalnız sizdə qalır.
        </p>
      </div>

      {limit <= 1 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
            <Users size={26} strokeWidth={1.5} aria-hidden />
          </span>
          <p className="mt-3 font-medium">Komanda Pro Max tarifindədir</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            Hazırkı tarifiniz: {PLAN_NAMES[plan]}. Pro Max-da səhifənizi 5 nəfərə qədər (siz daxil) birlikdə idarə edə bilərsiniz.
          </p>
          <Link href="/dashboard/billing" className="mt-4 inline-block rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
            Pro Max-a keç
          </Link>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Yeni üzv dəvət et</h2>
              <span className="text-sm text-gray-500">
                {used} / {limit} yer
              </span>
            </div>
            {canInvite ? (
              <InviteForm />
            ) : (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                Komandada yer qalmayıb ({limit} nəfər). Yeni adam dəvət etmək üçün əvvəlcə kimisə çıxarın.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white">
            <h2 className="border-b border-gray-100 px-5 py-4 font-semibold">Üzvlər</h2>
            <ul className="divide-y divide-gray-100">
              {members.map((m) => (
                <MemberRow
                  key={m.id}
                  member={{
                    id: m.id,
                    role: m.role,
                    status: m.status,
                    email: m.user?.email ?? m.invitedEmail,
                    name: [m.user?.firstName, m.user?.lastName].filter(Boolean).join(" ") || null,
                    dateNote:
                      m.status === "INVITED"
                        ? ` · dəvət: ${memberDate(m.invitedAt)}`
                        : m.acceptedAt
                          ? ` · qoşulub: ${memberDate(m.acceptedAt)}`
                          : "",
                  }}
                  roleLabels={ROLE_LABELS}
                  roleHints={ROLE_HINTS}
                  statusLabels={STATUS_LABELS}
                />
              ))}
            </ul>
          </section>
        </>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <Crown size={17} className="text-[var(--brand)]" aria-hidden /> Rollar nə edə bilir
        </h2>
        <ul className="mt-3 flex flex-col gap-2.5 text-sm">
          {(["OWNER", "MANAGER", "STAFF"] as const).map((role) => (
            <li key={role} className="flex flex-wrap gap-x-2 gap-y-0.5">
              <span className="font-medium text-gray-900">{ROLE_LABELS[role]}:</span>
              <span className="text-gray-600">{ROLE_HINTS[role]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
          Hər əməliyyat jurnalda kimin etdiyi ilə birlikdə qeyd olunur. Tarif Pro Max-dan düşsə, üzvlər silinmir — dondurulur
          və tarif bərpa olunanda geri qayıdır.
        </p>
      </section>

      <p className="flex items-start gap-2 text-xs text-gray-500">
        <Mail size={14} className="mt-0.5 shrink-0" aria-hidden />
        E-poçt provayderi qoşulmayıbsa, dəvət məktubu getmir — dəvət linkini ekrandan kopyalayıb özünüz göndərə bilərsiniz.
      </p>
    </div>
  );
}
