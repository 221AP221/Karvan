import { CreditCard, Crown, KeyRound, LayoutGrid, Mail, MonitorSmartphone, ShieldAlert, Timer } from "lucide-react";
import { IconBadge } from "@/components/landing/IconBadge";
import { requirePageAccess } from "@/lib/auth";
import { AUTO_DELETE_OPTIONS } from "@/lib/inactivity";
import { db } from "@/lib/db";
import { PLAN_LIMITS, PLAN_NAMES, startOfMonth } from "@/lib/plans";
import { invoicesUsedThisMonth } from "@/lib/invoices";
import { AutoDeleteForm, CatalogForm, DangerZone, EmailForm, PasswordForm, PaymentForm, SessionsButton } from "./forms";

function Section({ icon, title, text, children }: { icon: Parameters<typeof IconBadge>[0]["icon"]; title: string; text: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 border-b border-gray-200 py-8 last:border-0 md:grid-cols-[260px_1fr]">
      <div className="flex gap-3">
        <IconBadge icon={icon} size="sm" />
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{text}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5">{children}</div>
    </section>
  );
}

export default async function Settings() {
  const profile = await requirePageAccess("account");
  const plan = profile.user.subscription?.plan ?? "FREE";
  const limits = PLAN_LIMITS[plan];
  // Avtomatik silinmə ayarı və son giriş tarixi
  const account = await db.user.findUnique({ where: { id: profile.userId }, select: { autoDeleteAfterDays: true, lastSeenAt: true } });
  const lastSeen = account?.lastSeenAt
    ? new Intl.DateTimeFormat("az-AZ", { day: "2-digit", month: "long", year: "numeric" }).format(account.lastSeenAt)
    : null;

  const [sessions, invoicesThisMonth] = await Promise.all([
    db.session.count({ where: { userId: profile.userId, expiresAt: { gt: new Date() } } }),
    invoicesUsedThisMonth(profile.id),
  ]);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Parametrlər</h1>
          <p className="text-sm text-gray-500">Hesab, təhlükəsizlik və ödəniş ayarları</p>
        </div>

        {/* Plan: başlığın yanında, yığcam */}
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-4 md:w-96">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconBadge icon={Crown} size="sm" />
              <div>
                <p className="text-xs text-gray-500">Plan</p>
                <p className="font-semibold">{PLAN_NAMES[plan]}</p>
              </div>
            </div>
            <a href="/dashboard/billing" className="rounded-full bg-gradient-to-r from-violet-600 to-pink-600 px-3 py-1 text-xs font-semibold text-white">
              {plan === "FREE" ? "Tarifi yüksəlt" : "Planı idarə et"}
            </a>
          </div>
          {limits.invoicesPerMonth === Infinity ? (
            <p className="mt-3 text-sm text-gray-500">Limitsiz faktura</p>
          ) : (
            <>
              <div className="mt-3 flex justify-between text-xs text-gray-500">
                <span>Bu ayki fakturalar</span>
                <span className="font-medium text-gray-700">
                  {invoicesThisMonth} / {limits.invoicesPerMonth}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${Math.min(100, (invoicesThisMonth / limits.invoicesPerMonth) * 100)}%` }} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-2">
        <Section icon={Mail} title="E-poçt" text="Giriş üçün istifadə olunur">
          <EmailForm email={profile.user.email ?? ""} />
        </Section>

        <Section icon={KeyRound} title="Şifrə" text="Dəyişəndə digər cihazlardan avtomatik çıxılır">
          <PasswordForm />
        </Section>

        <Section icon={CreditCard} title="Faktura və ödəniş" text="Bu məlumatlar fakturada və müştəri səhifəsində göstərilir">
          <PaymentForm
            values={{
              invoicePrefix: profile.invoicePrefix,
              accountName: profile.accountName ?? "",
              bankName: profile.bankName ?? "",
              cardNumber: profile.cardNumber ?? "",
              iban: profile.iban ?? "",
            }}
          />
        </Section>

        <Section icon={LayoutGrid} title="Xidmətlər kataloqu" text="Yeni müştərilər sizi axtarışda tapsın">
          <CatalogForm visible={profile.showInCatalog} featured={limits.featured} />
        </Section>

        <Section icon={Timer} title="Passiv hesab" text="Uzun müddət giriş olmadıqda hesabın avtomatik silinməsi">
          <AutoDeleteForm
            enabled={account?.autoDeleteAfterDays != null}
            days={account?.autoDeleteAfterDays ?? 90}
            options={AUTO_DELETE_OPTIONS}
            lastSeen={lastSeen}
          />
        </Section>

        <Section icon={MonitorSmartphone} title="Sessiyalar" text="Hesabınıza daxil olunmuş cihazlar">
          <SessionsButton count={sessions} />
        </Section>

        <Section icon={ShieldAlert} title="Hesabı sil" text="Bütün məlumatlar birdəfəlik silinir">
          <DangerZone username={profile.username} />
        </Section>
      </div>
    </div>
  );
}
