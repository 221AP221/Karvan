import { CreditCard, Crown, KeyRound, LayoutGrid, Mail, MonitorSmartphone, ShieldAlert, Timer, UsersRound } from "lucide-react";
import Link from "next/link";
import { requirePageAccess } from "@/lib/auth";
import { AUTO_DELETE_OPTIONS } from "@/lib/inactivity";
import { db } from "@/lib/db";
import { PLAN_LIMITS, PLAN_NAMES } from "@/lib/plans";
import { invoicesUsedThisMonth } from "@/lib/invoices";
import { AutoDeleteForm, CatalogHint, DangerZone, EmailForm, PasswordForm, PaymentForm, SessionsButton } from "./forms";
import { CatalogSwitchRow, SettingLinkRow, SettingRow, SettingsGroup } from "./SettingsList";

const ICON = 16;

/** Kartın son 4 rəqəmi: hansı rekviziti yazdığınız açmadan bilinsin. */
function cardTail(card: string | null) {
  const digits = (card ?? "").replace(/\D/g, "");
  return digits.length >= 4 ? `···· ${digits.slice(-4)}` : null;
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

  const [sessions, invoicesThisMonth, teamCount] = await Promise.all([
    db.session.count({ where: { userId: profile.userId, expiresAt: { gt: new Date() } } }),
    invoicesUsedThisMonth(profile.id),
    profile.isOwner ? db.membership.count({ where: { profileId: profile.id } }) : Promise.resolve(0),
  ]);

  // Sətirdə göstərilən qısa dəyərlər: parametri açmadan nəyin yazıldığı görünsün
  const paymentValue = [profile.invoicePrefix && `${profile.invoicePrefix}-`, profile.bankName, cardTail(profile.cardNumber)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Parametrlər</h1>
          <p className="text-sm text-gray-500">Hesab, tarif, təhlükəsizlik və ödəniş ayarları</p>
        </div>

        {/* Plan: ayrıca kart deyil, başlığın yanında bir çip */}
        <div className="flex flex-wrap items-center gap-3 rounded-full border border-gray-200 bg-white py-1.5 pl-4 pr-1.5">
          <Crown size={ICON} className="text-[var(--brand)]" aria-hidden />
          <span className="text-sm font-semibold">{PLAN_NAMES[plan]}</span>
          <span className="h-4 w-px bg-gray-200" aria-hidden />
          <span className="text-sm text-gray-500">
            {limits.invoicesPerMonth === Infinity ? (
              "Limitsiz faktura"
            ) : (
              <>
                Bu ay{" "}
                <strong className="font-semibold tabular-nums text-gray-900">
                  {invoicesThisMonth} / {limits.invoicesPerMonth}
                </strong>{" "}
                faktura
              </>
            )}
          </span>
          <Link href="/dashboard/billing" className="rounded-full bg-[var(--brand)] px-3.5 py-1.5 text-sm font-semibold text-white transition hover:opacity-90">
            Tarifi dəyiş
          </Link>
        </div>
      </div>

      <SettingsGroup label="Hesab">
        <SettingRow id="e-poct" icon={<Mail size={ICON} />} title="E-poçt" value={profile.user.email ?? ""}>
          <EmailForm email={profile.user.email ?? ""} />
        </SettingRow>

        <SettingRow id="sifre" icon={<KeyRound size={ICON} />} title="Şifrə" value="••••••••">
          <PasswordForm />
        </SettingRow>

        <SettingRow
          id="sessiyalar"
          icon={<MonitorSmartphone size={ICON} />}
          title="Sessiyalar"
          value={sessions === 1 ? "yalnız bu cihaz" : `${sessions} aktiv cihaz`}
        >
          <SessionsButton count={sessions} />
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup label="Biznes">
        <SettingRow id="odenis" icon={<CreditCard size={ICON} />} title="Faktura və ödəniş" value={paymentValue || "doldurulmayıb"}>
          <PaymentForm
            values={{
              invoicePrefix: profile.invoicePrefix,
              accountName: profile.accountName ?? "",
              bankName: profile.bankName ?? "",
              cardNumber: profile.cardNumber ?? "",
              iban: profile.iban ?? "",
            }}
          />
        </SettingRow>

        {profile.isOwner && (
          <SettingLinkRow
            icon={<UsersRound size={ICON} />}
            title="Komanda"
            value={teamCount === 0 ? "üzv yoxdur" : `${teamCount} üzv`}
            href="/dashboard/team"
          />
        )}

        <CatalogSwitchRow icon={<LayoutGrid size={ICON} />} title="Xidmətlər kataloqu" visible={profile.showInCatalog} />
        <CatalogHint featured={limits.featured} />
      </SettingsGroup>

      <SettingsGroup label="Hesabın idarəsi">
        <SettingRow
          id="passiv-hesab"
          icon={<Timer size={ICON} />}
          title="Passiv hesab"
          value={account?.autoDeleteAfterDays ? `${account.autoDeleteAfterDays} gündən sonra sil` : "söndürülüb"}
        >
          <AutoDeleteForm
            enabled={account?.autoDeleteAfterDays != null}
            days={account?.autoDeleteAfterDays ?? 90}
            options={AUTO_DELETE_OPTIONS}
            lastSeen={lastSeen}
          />
        </SettingRow>

        <SettingRow id="hesabi-sil" icon={<ShieldAlert size={ICON} />} title="Hesabı sil" value="geri qaytarılmır" danger>
          <DangerZone username={profile.username} />
        </SettingRow>
      </SettingsGroup>
    </div>
  );
}
