import { SOURCES, SOURCE_LABELS, type Source } from "@/lib/analytics";
import { db } from "@/lib/db";
import { OPEN_STATUSES } from "@/lib/invoice-status";

// Analitika səhifəsinin bütün göstəriciləri: seçilmiş dövr və ondan əvvəlki eyni uzunluqlu dövr (müqayisə üçün)

export const PERIODS = [7, 30, 90, 365] as const;
export type Period = (typeof PERIODS)[number];

const DAY = 86_400_000;

export type Totals = Record<string, number>; // valyuta → qəpik

export type Bucket = { key: string; label: string; visitors: number; views: number; revenue: number; orders: number };

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avq", "sen", "okt", "noy", "dek"];
const shortDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

function add(totals: Totals, currency: string, amount: number) {
  totals[currency] = (totals[currency] ?? 0) + amount;
}

// Ox üçün yuvarlaq tavan: 1, 2, 2.5, 5 × 10^n
export function niceTop(max: number) {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 5, 10]) if (max <= m * pow) return m * pow;
  return 10 * pow;
}

// Dəyişmə faizi: əvvəlki dövr 0-dırsa, müqayisə mənasızdır
export function change(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export async function buildReport(profileId: string, period: Period, now = new Date()) {
  const end = now;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today.getTime() - (period - 1) * DAY);
  const prevStart = new Date(start.getTime() - period * DAY);

  const [events, orders, issued, paid, openInvoices, services] = await Promise.all([
    db.profileEvent.findMany({
      where: { profileId, createdAt: { gte: prevStart, lte: end } },
      select: { type: true, visitorId: true, source: true, device: true, target: true, createdAt: true },
    }),
    db.order.findMany({
      where: { profileId, createdAt: { gte: prevStart, lte: end } },
      select: {
        createdAt: true,
        status: true,
        source: true,
        serviceId: true,
        customerPhone: true,
        invoice: { select: { status: true, totalQepik: true, currency: true } },
      },
    }),
    db.invoice.findMany({
      where: { profileId, issuedAt: { gte: prevStart, lte: end } },
      select: { status: true, issuedAt: true },
    }),
    db.invoice.findMany({
      where: { profileId, status: "PAID", paidAt: { gte: prevStart, lte: end } },
      select: { totalQepik: true, currency: true, issuedAt: true, paidAt: true, order: { select: { source: true, serviceId: true } } },
    }),
    db.invoice.findMany({
      where: { profileId, status: { in: OPEN_STATUSES } },
      select: { totalQepik: true, currency: true, status: true, dueAt: true },
    }),
    db.service.findMany({ where: { profileId }, select: { id: true, title: true } }),
  ]);

  const inCur = (d: Date) => d >= start;
  const cur = { events: events.filter((e) => inCur(e.createdAt)), orders: orders.filter((o) => inCur(o.createdAt)) };
  const prev = { events: events.filter((e) => !inCur(e.createdAt)), orders: orders.filter((o) => !inCur(o.createdAt)) };
  const paidCur = paid.filter((i) => inCur(i.paidAt!));
  const paidPrev = paid.filter((i) => !inCur(i.paidAt!));

  // Auditoriya
  const audience = (list: typeof events) => {
    const views = list.filter((e) => e.type === "VIEW");
    const visitors = new Set(views.map((e) => e.visitorId));
    return {
      views: views.length,
      visitors: visitors.size,
      openers: new Set(list.filter((e) => e.type === "ORDER_OPEN").map((e) => e.visitorId)).size,
      phoneClicks: list.filter((e) => e.type === "PHONE_CLICK").length,
      linkClicks: list.filter((e) => e.type === "LINK_CLICK").length,
      visitorIds: visitors,
    };
  };
  const a = audience(cur.events);
  const aPrev = audience(prev.events);
  const returningVisitors = [...a.visitorIds].filter((v) => aPrev.visitorIds.has(v)).length;

  // Cihaz: hər ziyarətçi bir dəfə sayılır
  const deviceOf = new Map<string, string>();
  for (const e of cur.events) if (e.type === "VIEW") deviceOf.set(e.visitorId, e.device);
  const mobile = [...deviceOf.values()].filter((d) => d === "mobile").length;

  // Satış
  const sum = (list: typeof paid) => list.reduce<Totals>((t, i) => (add(t, i.currency, i.totalQepik), t), {});
  const revenue = sum(paidCur);
  const revenuePrev = sum(paidPrev);
  const aznPaid = paidCur.filter((i) => i.currency === "AZN");
  const aznPaidPrev = paidPrev.filter((i) => i.currency === "AZN");
  const avg = (list: typeof paid) => (list.length ? list.reduce((s, i) => s + i.totalQepik, 0) / list.length : 0);
  const payHours = (list: typeof paid) =>
    list.length ? list.reduce((s, i) => s + (i.paidAt!.getTime() - i.issuedAt.getTime()), 0) / list.length / 3_600_000 : null;

  const issuedCur = issued.filter((i) => inCur(i.issuedAt) && i.status !== "CANCELLED" && i.status !== "DRAFT");
  const issuedPrev = issued.filter((i) => !inCur(i.issuedAt) && i.status !== "CANCELLED" && i.status !== "DRAFT");
  const rate = (list: typeof issued) => (list.length ? (list.filter((i) => i.status === "PAID").length / list.length) * 100 : null);

  const outstanding: Totals = {};
  const overdue: Totals = {};
  for (const inv of openInvoices) {
    add(outstanding, inv.currency, inv.totalQepik);
    if (inv.status === "OVERDUE" || (inv.dueAt && inv.dueAt < now)) add(overdue, inv.currency, inv.totalQepik);
  }

  // Müştərilər: dövrdən əvvəl də sifariş vermiş nömrələr "qayıdan" sayılır.
  // Yalnız bu dövrün nömrələrini soruşuruq — bütün tarixçəni çəkmək səhifəni illər keçdikcə yavaşladırdı.
  const customers = new Set(cur.orders.map((o) => o.customerPhone));
  const earlier = customers.size
    ? await db.order.findMany({
        where: { profileId, createdAt: { lt: start }, customerPhone: { in: [...customers] } },
        select: { customerPhone: true },
        distinct: ["customerPhone"],
      })
    : [];
  const before = new Set(earlier.map((c) => c.customerPhone));
  const returningCustomers = [...customers].filter((c) => before.has(c)).length;
  const repeatInPeriod = [...customers].filter((c) => cur.orders.filter((o) => o.customerPhone === c).length > 1).length;

  // Qıf
  const paidOrders = cur.orders.filter((o) => o.invoice?.status === "PAID").length;
  // `key` interfeysdə tərcümə üçün, `label` isə CSV ixracı üçün (Azərbaycan dilində)
  const funnel = [
    { key: "viewed" as const, label: "Səhifəyə baxan", value: a.visitors },
    { key: "opened" as const, label: "Sifariş formasını açan", value: a.openers },
    { key: "ordered" as const, label: "Sifariş verən", value: cur.orders.length },
    { key: "paid" as const, label: "Ödəyən", value: paidOrders },
  ];

  // Mənbələr
  const bySource = new Map<Source, { visitors: Set<string>; orders: number; revenue: number }>();
  for (const s of SOURCES) bySource.set(s, { visitors: new Set(), orders: 0, revenue: 0 });
  for (const e of cur.events) if (e.type === "VIEW") bySource.get(e.source as Source)?.visitors.add(e.visitorId);
  for (const o of cur.orders) {
    const row = o.source ? bySource.get(o.source as Source) : undefined;
    if (row) row.orders++;
  }
  for (const i of aznPaid) {
    const s = i.order?.source as Source | undefined;
    if (s && bySource.has(s)) bySource.get(s)!.revenue += i.totalQepik;
  }
  const sources = [...bySource.entries()]
    .map(([key, v]) => ({ key, label: SOURCE_LABELS[key], visitors: v.visitors.size, orders: v.orders, revenue: v.revenue }))
    .filter((s) => s.visitors || s.orders)
    .sort((x, y) => y.visitors - x.visitors);

  // Xidmətlər
  const title = new Map(services.map((s) => [s.id, s.title]));
  const svc = new Map<string, { opens: number; orders: number; revenue: number }>();
  const svcRow = (id: string) => svc.get(id) ?? (svc.set(id, { opens: 0, orders: 0, revenue: 0 }), svc.get(id)!);
  for (const e of cur.events) if (e.type === "ORDER_OPEN" && e.target && title.has(e.target)) svcRow(e.target).opens++;
  for (const o of cur.orders) if (o.serviceId && title.has(o.serviceId)) svcRow(o.serviceId).orders++;
  for (const i of aznPaid) if (i.order?.serviceId && title.has(i.order.serviceId)) svcRow(i.order.serviceId).revenue += i.totalQepik;
  const topServices = [...svc.entries()]
    .map(([id, v]) => ({ id, title: title.get(id)!, ...v }))
    .sort((x, y) => y.revenue - x.revenue || y.orders - x.orders)
    .slice(0, 6);

  // Klik edilən linklər
  const clicks = new Map<string, number>();
  for (const e of cur.events) if (e.type === "LINK_CLICK" && e.target) clicks.set(e.target, (clicks.get(e.target) ?? 0) + 1);
  const topLinks = [...clicks.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6);

  // Zaman sırası: 7 və 30 gündə günlük, 90 gündə həftəlik
  const step = period === 90 ? 7 : 1;
  const buckets: Bucket[] = [];
  const bucketOf = new Map<string, Bucket>();
  for (let t = start.getTime(); t <= today.getTime(); t += step * DAY) {
    const from = new Date(t);
    const to = new Date(Math.min(t + (step - 1) * DAY, today.getTime()));
    const b: Bucket = {
      key: dayKey(from),
      label: step === 1 ? shortDate(from) : `${shortDate(from)} – ${shortDate(to)}`,
      visitors: 0,
      views: 0,
      revenue: 0,
      orders: 0,
    };
    buckets.push(b);
    for (let k = 0; k < step; k++) bucketOf.set(dayKey(new Date(t + k * DAY)), b);
  }
  const seen = new Map<Bucket, Set<string>>();
  for (const e of cur.events) {
    if (e.type !== "VIEW") continue;
    const b = bucketOf.get(dayKey(e.createdAt));
    if (!b) continue;
    b.views++;
    if (!seen.has(b)) seen.set(b, new Set());
    seen.get(b)!.add(e.visitorId);
  }
  for (const [b, set] of seen) b.visitors = set.size;
  for (const i of aznPaid) {
    const b = bucketOf.get(dayKey(i.paidAt!));
    if (b) b.revenue += i.totalQepik;
  }
  for (const o of cur.orders) {
    const b = bucketOf.get(dayKey(o.createdAt));
    if (b) b.orders++;
  }

  const conversion = a.visitors ? (cur.orders.length / a.visitors) * 100 : null;
  const conversionPrev = aPrev.visitors ? (prev.orders.length / aPrev.visitors) * 100 : null;

  return {
    period,
    start,
    hasEvents: events.length > 0,
    sales: {
      revenue,
      revenueAzn: revenue.AZN ?? 0,
      revenueAznPrev: revenuePrev.AZN ?? 0,
      orders: cur.orders.length,
      ordersPrev: prev.orders.length,
      avgOrder: avg(aznPaid),
      avgOrderPrev: avg(aznPaidPrev),
      paidRate: rate(issuedCur),
      paidRatePrev: rate(issuedPrev),
      payHours: payHours(paidCur),
      payHoursPrev: payHours(paidPrev),
      pendingApproval: cur.orders.filter((o) => o.status === "PENDING_APPROVAL").length,
      outstanding,
      overdue,
    },
    audience: {
      views: a.views,
      viewsPrev: aPrev.views,
      visitors: a.visitors,
      visitorsPrev: aPrev.visitors,
      conversion,
      conversionPrev,
      phoneClicks: a.phoneClicks,
      phoneClicksPrev: aPrev.phoneClicks,
      linkClicks: a.linkClicks,
      returningVisitors,
      mobileShare: deviceOf.size ? (mobile / deviceOf.size) * 100 : null,
      mobile,
      desktop: deviceOf.size - mobile,
    },
    customers: { total: customers.size, returning: returningCustomers, repeatInPeriod },
    funnel,
    sources,
    topServices,
    topLinks,
    buckets,
  };
}

export type Report = Awaited<ReturnType<typeof buildReport>>;
