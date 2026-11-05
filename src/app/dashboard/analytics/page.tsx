import {
  AlertTriangle,
  Download,
  Lock,
  Clock,
  Eye,
  Lightbulb,
  Link2,
  Monitor,
  MousePointerClick,
  Percent,
  PhoneCall,
  Receipt,
  Repeat,
  ShoppingBag,
  Smartphone,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { type Dict, getDictionary, getLocale } from "@/i18n/server";
import { PERIODS, buildReport, change, niceTop, type Period, type Report, type Totals } from "@/lib/analytics-report";
import { formatMoney } from "@/lib/money";
import { PLAN_LIMITS } from "@/lib/plans";
import { param, type SearchParams } from "@/lib/search-params";
import { PLATFORM_BY_KEY } from "@/lib/social";
import { CopyLink } from "../invoices/[id]/client";
import { BarChart } from "./charts";

export const metadata: Metadata = { title: "Analitika" };

const pct = (v: number | null, digits = 1) => (v === null ? "—" : `${v.toFixed(digits).replace(".", ",")}%`);
const int = (v: number) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const azn = (q: number) => formatMoney(q, "AZN");
const aznShort = (q: number) => `${int(q / 100)} ₼`;

function hours(h: number | null, words: Dict["panel"]["analytics"]) {
  if (h === null) return "—";
  if (h < 1) return words.lessThanHour;
  if (h < 48) return `${Math.round(h)} ${words.hoursUnit}`;
  return `${(h / 24).toFixed(1).replace(".", ",")} ${words.daysUnit}`;
}

function totals(t: Totals) {
  const parts = Object.entries(t)
    .filter(([, v]) => v)
    .map(([c, v]) => formatMoney(v, c));
  return parts.length ? parts.join(" + ") : formatMoney(0, "AZN");
}

// Əvvəlki dövrlə müqayisə: rəng + ox + mətn (yalnız rəngə güvənmirik)
function Delta({ value, invert = false, points = false }: { value: number | null; invert?: boolean; points?: boolean }) {
  if (value === null || !Number.isFinite(value)) return <span className="text-xs text-gray-400">müqayisə yoxdur</span>;
  const good = invert ? value < 0 : value > 0;
  const flat = Math.abs(value) < 0.5;
  const Icon = value >= 0 ? TrendingUp : TrendingDown;
  const text = `${value > 0 ? "+" : ""}${value.toFixed(1).replace(".", ",")}${points ? " b.p." : "%"}`;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${flat ? "text-gray-500" : good ? "text-emerald-700" : "text-red-700"}`}>
      {!flat && <Icon size={13} strokeWidth={2.25} aria-hidden />}
      {text}
    </span>
  );
}

function Kpi({ icon: Icon, label, value, delta, hint }: { icon: LucideIcon; label: string; value: string; delta?: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-gray-200 bg-white p-4">
      <span className="flex items-center gap-2 text-sm text-gray-500">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--brand)]/10 text-[var(--brand)]">
          <Icon size={15} strokeWidth={1.9} aria-hidden />
        </span>
        {label}
      </span>
      <span className="text-xl font-bold tabular-nums leading-tight text-gray-900">{value}</span>
      {delta}
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  );
}

function SectionTitle({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

// Üfüqi zolaq: tək rəng, dəyər mətnlə yanında
function HBar({ label, value, max, display, sub }: { label: string; value: number; max: number; display: string; sub?: string }) {
  return (
    <li>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-gray-800">{label}</span>
        <span className="tabular-nums text-gray-900">
          {display}
          {sub && <span className="ml-1.5 text-xs text-gray-400">{sub}</span>}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-[var(--brand)]" style={{ width: `${max ? Math.max(value ? 2 : 0, (value / max) * 100) : 0}%` }} />
      </div>
    </li>
  );
}

function TableView({ caption, head, rows, label }: { caption: string; head: string[]; rows: (string | number)[][]; label: string }) {
  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-800">{label}</summary>
      <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-gray-100">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-gray-50 text-gray-500">
            <tr>{head.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-gray-100">
                {r.map((c, j) => <td key={j} className="px-3 py-1.5">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Insights({ r, t }: { r: Report; t: Dict["panel"]["analytics"] }) {
  const tips: string[] = [];
  const best = r.sources.filter((s) => s.visitors >= 5).sort((x, y) => y.orders / y.visitors - x.orders / x.visitors)[0];
  if (best && best.orders) tips.push(t.tipBestSource.replace("{source}", best.label).replace("{n}", String(Math.round((best.orders / best.visitors) * 100))));
  const [visit, open] = r.funnel;
  if (visit.value >= 10 && open.value / visit.value < 0.08) tips.push(t.tipFunnel);
  if (r.sales.paidRate !== null && r.sales.paidRate < 60) tips.push(t.tipPayRate);
  if (r.audience.mobileShare !== null && r.audience.mobileShare > 70) tips.push(t.tipMobile.replace("{n}", String(Math.round(r.audience.mobileShare))));
  if (r.customers.total >= 5 && r.customers.returning / r.customers.total < 0.15) tips.push(t.tipReturning);
  if (!tips.length) return null;
  return (
    <Card title={t.tips}>
      <ul className="flex flex-col gap-2.5 text-sm text-gray-700">
        {tips.map((t) => (
          <li key={t} className="flex gap-2.5">
            <Lightbulb size={16} strokeWidth={1.9} className="mt-0.5 shrink-0 text-amber-500" aria-hidden />
            {t}
          </li>
        ))}
      </ul>
    </Card>
  );
}

const TAGGED = [
  { tag: "ig", key: "taggedIg" },
  { tag: "tt", key: "taggedTt" },
  { tag: "wa", key: "taggedWa" },
  { tag: "tg", key: "taggedTg" },
] as const;

export default async function AnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireProfile();
  const locale = await getLocale();
  const t = getDictionary(locale).panel.analytics;
  const raw = Number(param(await searchParams, "p"));
  const period: Period = (PERIODS as readonly number[]).includes(raw) ? (raw as Period) : 30;
  const r = await buildReport(profile.id, period);
  const reports = PLAN_LIMITS[profile.user.subscription?.plan ?? "FREE"].reports;
  const s = r.sales;
  const a = r.audience;
  const pageUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/${profile.username}`;

  const revenueTop = niceTop(Math.max(...r.buckets.map((b) => b.revenue)) || 10_000);
  const visitorsTop = niceTop(Math.max(1, ...r.buckets.map((b) => b.visitors)));
  const funnelTop = r.funnel[0].value;
  const sourceTop = Math.max(1, ...r.sources.map((x) => x.visitors));
  const unit = period === 90 ? t.week : t.day;
  // Qıf addımlarının və mənbələrin adları seçilmiş dildə
  const funnelLabel = { viewed: t.funnelViewed, opened: t.funnelOpened, ordered: t.funnelOrdered, paid: t.funnelPaid };
  const sourceLabel: Record<string, string> = {
    instagram: t.srcInstagram,
    tiktok: t.srcTiktok,
    whatsapp: t.srcWhatsapp,
    facebook: t.srcFacebook,
    telegram: t.srcTelegram,
    search: t.srcSearch,
    direct: t.srcDirect,
    other: t.srcOther,
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-sm text-gray-500">{t.text.replace("{n}", String(period))}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        {reports ? (
          <a href={`/api/analytics/export?p=${period}`} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400">
            <Download size={15} aria-hidden /> {t.exportReport}
          </a>
        ) : (
          <span title={t.proOnly} className="inline-flex items-center gap-2 rounded-full border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-400">
            <Lock size={14} aria-hidden /> {t.exportLocked}
          </span>
        )}
        <nav className="inline-flex rounded-full border border-gray-200 bg-white p-1 text-sm" aria-label={t.period}>
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={`/dashboard/analytics?p=${p}`}
              scroll={false}
              aria-current={p === period ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 font-medium transition ${p === period ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"}`}
            >
              {p} {t.days}
            </Link>
          ))}
        </nav>
        </div>
      </div>

      {!r.hasEvents && (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-600">
          {t.noEvents}
        </p>
      )}

      {/* Satış */}
      <section>
        <SectionTitle title={t.salesTitle} text={t.salesText} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 [&>*]:min-w-0">
          <Kpi icon={Wallet} label={t.revenue} value={totals(s.revenue)} delta={<Delta value={change(s.revenueAzn, s.revenueAznPrev)} />} />
          <Kpi icon={ShoppingBag} label={t.orders} value={int(s.orders)} delta={<Delta value={change(s.orders, s.ordersPrev)} />} hint={s.pendingApproval ? t.pendingHint.replace("{n}", String(s.pendingApproval)) : undefined} />
          <Kpi icon={Receipt} label={t.avgOrder} value={s.avgOrder ? azn(s.avgOrder) : "—"} delta={<Delta value={change(s.avgOrder, s.avgOrderPrev)} />} />
          <Kpi
            icon={Percent}
            label={t.payRate}
            value={pct(s.paidRate, 0)}
            delta={<Delta value={s.paidRate !== null && s.paidRatePrev !== null ? s.paidRate - s.paidRatePrev : null} points />}
            hint={t.payRateHint}
          />
          <Kpi icon={Clock} label={t.payTime} value={hours(s.payHours, t)} delta={<Delta value={s.payHours !== null && s.payHoursPrev !== null ? change(s.payHours, s.payHoursPrev) : null} invert />} />
          <Kpi icon={Wallet} label={t.outstanding} value={totals(s.outstanding)} hint={t.outstandingHint} />
          <Kpi icon={AlertTriangle} label={t.overdue} value={totals(s.overdue)} hint={t.overdueHint} />
          <Kpi icon={Repeat} label={t.returning} value={r.customers.total ? pct((r.customers.returning / r.customers.total) * 100, 0) : "—"} hint={t.returningHint.replace("{total}", String(r.customers.total)).replace("{n}", String(r.customers.returning))} />
        </div>

        <div className="mt-3">
        <Card title={t.revenueChart.replace("{unit}", period === 90 ? t.byWeek : t.byDay)}>
          <BarChart
            ariaLabel={t.paidRevenue}
            data={r.buckets.map((b) => ({ label: b.label, value: b.revenue, display: azn(b.revenue) }))}
            top={revenueTop}
            ticks={[aznShort(revenueTop), aznShort(revenueTop / 2), "0"]}
          />
          <TableView label={t.tableView} caption={t.revenue} head={[unit, t.revenue, t.ordersShort]} rows={r.buckets.map((b) => [b.label, azn(b.revenue), b.orders])} />
        </Card>
        </div>
      </section>

      {/* Auditoriya */}
      <section>
        <SectionTitle title={t.audienceTitle} text={t.audienceText} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 [&>*]:min-w-0">
          <Kpi icon={Users} label={t.visitors} value={int(a.visitors)} delta={<Delta value={change(a.visitors, a.visitorsPrev)} />} />
          <Kpi icon={Eye} label={t.views} value={int(a.views)} delta={<Delta value={change(a.views, a.viewsPrev)} />} hint={a.visitors ? t.viewsHint.replace("{n}", (a.views / a.visitors).toFixed(1).replace(".", ",")) : undefined} />
          <Kpi
            icon={MousePointerClick}
            label={t.conversion}
            value={pct(a.conversion)}
            delta={<Delta value={a.conversion !== null && a.conversionPrev !== null ? a.conversion - a.conversionPrev : null} points />}
            hint={t.conversionHint}
          />
          <Kpi icon={PhoneCall} label={t.phoneClicks} value={int(a.phoneClicks)} delta={<Delta value={change(a.phoneClicks, a.phoneClicksPrev)} />} hint={t.linkClicksHint.replace("{n}", int(a.linkClicks))} />
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
          <Card title={t.visitorsChart.replace("{unit}", period === 90 ? t.byWeek : t.byDay)}>
            <BarChart
              ariaLabel={t.visitors}
              data={r.buckets.map((b) => ({ label: b.label, value: b.visitors, display: `${int(b.visitors)} ${t.visitorsUnit}` }))}
              top={visitorsTop}
              ticks={[int(visitorsTop), visitorsTop >= 2 ? int(visitorsTop / 2) : "", "0"]}
            />
            <TableView label={t.tableView} caption={t.visitors} head={[unit, t.visitorsShort, t.viewsShort]} rows={r.buckets.map((b) => [b.label, b.visitors, b.views])} />
          </Card>

          <Card title={t.funnel}>
            <ol className="flex flex-col gap-3">
              {r.funnel.map((step, i) => {
                const prevStep = r.funnel[i - 1];
                return (
                  <HBar
                    key={step.key}
                    label={`${i + 1}. ${funnelLabel[step.key]}`}
                    value={step.value}
                    max={funnelTop}
                    display={int(step.value)}
                    sub={prevStep ? (prevStep.value ? `${pct((step.value / prevStep.value) * 100, 0)} ${t.fromPrevious}` : "—") : undefined}
                  />
                );
              })}
            </ol>
            <p className="mt-4 text-xs text-gray-500">{t.funnelHint}</p>
          </Card>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
          <Card title={t.sources}>
            {r.sources.length ? (
              <>
                <ul className="flex flex-col gap-3">
                  {r.sources.map((x) => (
                    <HBar
                      key={x.key}
                      label={sourceLabel[x.key] ?? x.label}
                      value={x.visitors}
                      max={sourceTop}
                      display={`${int(x.visitors)} ${t.visitorsUnit}`}
                      sub={`${x.orders} ${t.ordersShort.toLowerCase()} · ${x.visitors ? pct((x.orders / x.visitors) * 100, 0) : "—"}`}
                    />
                  ))}
                </ul>
                <TableView
                  label={t.tableView}
                  caption={t.sources}
                  head={[t.source, t.visitorsShort, t.ordersShort, t.conversion, t.revenue]}
                  rows={r.sources.map((x) => [sourceLabel[x.key] ?? x.label, x.visitors, x.orders, x.visitors ? pct((x.orders / x.visitors) * 100) : "—", azn(x.revenue)])}
                />
              </>
            ) : (
              <p className="text-sm text-gray-500">{t.noData}</p>
            )}
          </Card>

          <div className="flex flex-col gap-3">
            <Card title={t.devices}>
              {a.mobile + a.desktop ? (
                <>
                  <div className="flex h-3 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={`${t.phone} ${a.mobile}, ${t.desktop.toLowerCase()} ${a.desktop}`}>
                    <div className="bg-[var(--brand)]" style={{ width: `${(a.mobile / (a.mobile + a.desktop)) * 100}%` }} />
                    <div className="flex-1 bg-[#2a78d6]" />
                  </div>
                  <ul className="mt-3 flex justify-between text-sm">
                    <li className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" aria-hidden />
                      <Smartphone size={15} className="text-gray-400" aria-hidden /> {t.phone}
                      <strong className="tabular-nums">{pct((a.mobile / (a.mobile + a.desktop)) * 100, 0)}</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2a78d6]" aria-hidden />
                      <Monitor size={15} className="text-gray-400" aria-hidden /> {t.desktop}
                      <strong className="tabular-nums">{pct((a.desktop / (a.mobile + a.desktop)) * 100, 0)}</strong>
                    </li>
                  </ul>
                </>
              ) : (
                <p className="text-sm text-gray-500">{t.noData}</p>
              )}
            </Card>
            <Card title={t.newVsReturning}>
              <p className="text-sm text-gray-600">
                {t.returningLine
                  .replace("{n}", int(a.returningVisitors))
                  .replace("{days}", String(period))
                  .replace("{pct}", a.visitors ? ` (${pct((a.returningVisitors / a.visitors) * 100, 0)})` : "")
                  .replace("{rest}", int(a.visitors - a.returningVisitors))}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Xidmətlər və linklər */}
      <section className="grid gap-3 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <Card title={t.servicePerformance}>
          {r.topServices.length ? (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="text-xs text-gray-500">
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-2 font-medium">{t.service}</th>
                    <th className="px-2 py-2 text-right font-medium">{t.formOpened}</th>
                    <th className="px-2 py-2 text-right font-medium">{t.ordersShort}</th>
                    <th className="px-2 py-2 text-right font-medium">{t.conversion}</th>
                    <th className="px-5 py-2 text-right font-medium">{t.revenue}</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {r.topServices.map((x) => (
                    <tr key={x.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-2.5 font-medium text-gray-800">{x.title}</td>
                      <td className="px-2 py-2.5 text-right">{x.opens}</td>
                      <td className="px-2 py-2.5 text-right">{x.orders}</td>
                      <td className="px-2 py-2.5 text-right">{x.opens ? pct((x.orders / x.opens) * 100, 0) : "—"}</td>
                      <td className="px-5 py-2.5 text-right font-semibold">{azn(x.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t.serviceNoInterest}</p>
          )}
        </Card>

        <Card title={t.topLinks}>
          {r.topLinks.length ? (
            <ul className="flex flex-col gap-3">
              {r.topLinks.map(([target, count]) => (
                <HBar key={target} label={PLATFORM_BY_KEY[target as keyof typeof PLATFORM_BY_KEY]?.label ?? target} value={count} max={r.topLinks[0][1]} display={`${count} ${t.clicksUnit}`} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">{t.noClicks}</p>
          )}
        </Card>
      </section>

      <Insights r={r} t={t} />

      <Card title={t.taggedLinks}>
        <p className="mb-4 flex gap-2 text-sm text-gray-600">
          <Link2 size={16} className="mt-0.5 shrink-0 text-[var(--brand)]" aria-hidden />
          {t.taggedHint}
        </p>
        <ul className="flex flex-col divide-y divide-gray-100">
          {TAGGED.map((tag) => (
            <li key={tag.tag} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span className="text-sm">
                <span className="font-medium">{t[tag.key]}</span>
                <span className="ml-2 font-mono text-xs text-gray-500">{`${pageUrl}?s=${tag.tag}`}</span>
              </span>
              <CopyLink url={`${pageUrl}?s=${tag.tag}`} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
