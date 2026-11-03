import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Briefcase,
  Brush,
  Camera,
  ChartColumn,
  Check,
  CheckCheck,
  Clapperboard,
  Crown,
  Dumbbell,
  FileText,
  GraduationCap,
  Hand,
  Languages,
  LayoutGrid,
  Link2,
  Megaphone,
  MessageCircle,
  Palette,
  PenTool,
  Plus,
  QrCode,
  Receipt,
  Rocket,
  Search,
  Send,
  ShoppingBag,
  Smartphone,
  Sparkles,
  TrendingUp,
  Wallet,
  WandSparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { AiDemo } from "@/components/landing/AiDemo";
import { Appear } from "@/components/landing/Appear";
import { Header } from "@/components/landing/Header";
import { HeroHeadline } from "@/components/landing/HeroHeadline";
import { HeroPhone } from "@/components/landing/HeroPhone";
import { IconBadge } from "@/components/landing/IconBadge";
import { Marquee } from "@/components/landing/Marquee";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { StepsTimeline } from "@/components/landing/StepsTimeline";
import Magnet from "@/components/reactbits/Magnet";
import ScrollReveal from "@/components/reactbits/ScrollReveal";
import ShinyText from "@/components/reactbits/ShinyText";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CATALOG_PATH, HOME_PATH, type Locale, SITE_URL } from "@/i18n/config";
import type { Dict } from "@/i18n/server";
import { PLAN_PRICES } from "@/lib/plans";
import { jsonLdScript } from "@/lib/seo";

const NICHE_ICONS = [Brush, GraduationCap, PenTool, Megaphone, Camera, Hand, Dumbbell, Brain, Briefcase, Send, Clapperboard, Languages];
const STEP_ICONS = [Palette, Link2, Receipt, TrendingUp];
const FEATURE_ICONS = [Smartphone, ShoppingBag, FileText, Wallet, ChartColumn, LayoutGrid];
const AI_ICONS = [WandSparkles, PenTool, Palette, MessageCircle];
const PLAN_KEYS = ["FREE", "PRO", "PRO_MAX"] as const;
const PLAN_ICONS = [Rocket, BadgeCheck, Crown];

// Paketlərin üzərinə gəldikdə arxa fon həmin paketin rənginə keçir
const PLAN_HOVER = [
  "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700",
  "bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500",
  "bg-gradient-to-br from-[#2a0a1f] via-violet-800 to-amber-600",
];

function SectionTitle({ eyebrow, title, text, dark = false }: { eyebrow: React.ReactNode; title: string; text?: string; dark?: boolean }) {
  return (
    <Appear stagger={0.08} className="mx-auto max-w-3xl text-center">
      <p className={`inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] ${dark ? "text-violet-300" : "text-violet-600 dark:text-violet-300"}`}>{eyebrow}</p>
      <h2 className="mt-4 text-balance text-3xl font-bold leading-tight sm:text-5xl sm:leading-[1.1]">{title}</h2>
      {text && <p className={`mt-5 text-pretty text-lg ${dark ? "text-gray-400" : "text-gray-600 dark:text-gray-400"}`}>{text}</p>}
    </Appear>
  );
}

function StructuredData({ t, locale }: { t: Dict; locale: Locale }) {
  const url = `${SITE_URL}${HOME_PATH[locale] === "/" ? "" : HOME_PATH[locale]}`;
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Karvan",
      url,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: locale,
      description: t.meta.description,
      offers: t.pricing.plans.map((p, i) => ({
        "@type": "Offer",
        name: p.name,
        price: PLAN_PRICES[PLAN_KEYS[i]].replace(",", "."),
        priceCurrency: "AZN",
      })),
      areaServed: ["AZ", "TR", "GE", "KZ"],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "Karvan",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      description: t.footer.tagline,
      address: { "@type": "PostalAddress", addressLocality: "Bakı", addressCountry: "AZ" },
      contactPoint: [{ "@type": "ContactPoint", telephone: "*0221", email: "hello@karvan.az", contactType: "customer support", availableLanguage: ["az", "tr", "ru", "en"] }],
      areaServed: ["AZ", "TR", "GE", "KZ"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: "Karvan",
      inLanguage: locale,
      publisher: { "@id": `${SITE_URL}#organization` },
      // Google-un sayt daxili axtarış qutusu üçün
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}${CATALOG_PATH[locale]}?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: t.faq.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(data)} />;
}

// "Əvvəl": DM yazışması
function ChatMock({ t }: { t: Dict["compare"] }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-white/10">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-violet-600 text-xs font-bold text-white">N</span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">nermin.a</p>
          <p className="text-xs text-gray-400">Direct</p>
        </div>
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        {t.chat.map((m, i) => (
          <li key={i} className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${m.me ? "self-end rounded-br-md bg-violet-600 text-white" : "self-start rounded-bl-md bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100"}`}>
            {m.text}
          </li>
        ))}
      </ul>
      <ul className="mt-5 grid grid-cols-2 gap-2 text-sm">
        {t.beforePoints.map((p) => (
          <li key={p} className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-red-700 dark:bg-red-500/10 dark:text-red-300">
            <X size={14} strokeWidth={2.5} className="shrink-0" aria-hidden /> {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

// "Karvan ilə": faktura kartı
function InvoiceMock({ t }: { t: Dict["compare"] }) {
  return (
    <div className="relative rounded-3xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/70 to-white p-5 shadow-xl shadow-emerald-900/5 dark:border-emerald-400/20 dark:from-emerald-500/10 dark:to-transparent">
      <div className="rounded-2xl bg-white p-5 text-gray-900 shadow-lg shadow-gray-900/5 ring-1 ring-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">{t.invoice.label}</p>
            <p className="font-mono text-sm font-semibold">LEY-2026-0042</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <CheckCheck size={13} strokeWidth={2.5} aria-hidden /> {t.invoice.status}
          </span>
        </div>
        <div className="mt-4 flex justify-between border-b border-dashed border-gray-200 pb-3 text-sm">
          <span>{t.invoice.service}</span>
          <span className="tabular-nums">40,00 AZN</span>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <span className="text-sm text-gray-500">{t.invoice.total}</span>
          <span className="text-2xl font-bold tabular-nums">40,00 AZN</span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gray-900 text-white">
            <QrCode size={28} strokeWidth={1.6} aria-hidden />
          </span>
          <span className="text-xs leading-relaxed text-gray-500">Kapital Bank · 4169 •••• 1234 · IBAN AZ21••••</span>
        </div>
      </div>
      <div className="mx-3 -mt-2 flex items-center justify-between gap-3 rounded-b-2xl bg-gray-900 px-4 pb-3 pt-5 text-sm text-white">
        <span className="text-white/80">{t.invoice.claimed}</span>
        <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold">{t.invoice.confirm}</span>
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-2 text-sm">
        {t.afterPoints.map((p) => (
          <li key={p} className="flex items-center gap-2 rounded-xl bg-emerald-100/70 px-3 py-2 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
            <Check size={14} strokeWidth={2.75} className="shrink-0" aria-hidden /> {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingPage({ locale, t }: { locale: Locale; t: Dict }) {
  const catalog = CATALOG_PATH[locale];
  return (
    <SmoothScroll>
      <StructuredData t={t} locale={locale} />
      <div className="overflow-x-clip bg-white text-gray-900 [color-scheme:light] dark:bg-[#0c0c0f] dark:text-gray-100 dark:[color-scheme:dark]">
        <Header locale={locale} nav={t.nav} common={t.common} paths={HOME_PATH} />

        {/* Hero */}
        <section className="relative pt-28 sm:pt-36">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="animate-blob absolute -left-32 -top-24 h-96 w-96 rounded-full bg-violet-300/40 blur-3xl dark:bg-violet-600/25" />
            <div className="animate-blob absolute -right-24 top-20 h-96 w-96 rounded-full bg-pink-300/40 blur-3xl dark:bg-pink-600/20" style={{ animationDelay: "-6s" }} />
            <div
              className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12] dark:invert"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, rgb(17 24 39 / 0.12) 1px, transparent 0)",
                backgroundSize: "28px 28px",
                maskImage: "linear-gradient(to bottom, black, transparent 85%)",
              }}
            />
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-4 pb-24 lg:grid-cols-[1.1fr_1fr]">
            <div className="text-center lg:text-left">
              <Appear trigger="mount" distance={12} duration={0.5}>
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-1.5 text-sm shadow-sm backdrop-blur dark:border-violet-400/30 dark:bg-white/5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-600" />
                  </span>
                  <ShinyText text={t.hero.badge} color="#D6127E" shineColor="#FFC3E0" speed={3} />
                </span>
              </Appear>

              <HeroHeadline lead={t.hero.lead} words={t.hero.words} className="mt-6 text-[2.5rem] leading-[1.08] sm:text-6xl lg:text-7xl" />

              <Appear trigger="mount" delay={0.15}>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-600 lg:mx-0 dark:text-gray-400">{t.hero.text}</p>
              </Appear>

              <Appear trigger="mount" delay={0.25} stagger={0.08} className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Magnet padding={60} magnetStrength={3} wrapperClassName="w-full sm:w-auto">
                  <Link
                    href="/signup"
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 px-8 py-4 font-semibold text-white shadow-xl shadow-violet-500/30 transition-shadow hover:shadow-2xl hover:shadow-violet-500/40 sm:w-auto"
                  >
                    {t.hero.primary}
                    <ArrowRight size={18} strokeWidth={2} className="transition-transform group-hover:translate-x-1" aria-hidden />
                  </Link>
                </Magnet>
                <Magnet padding={40} magnetStrength={4} wrapperClassName="w-full sm:w-auto">
                  <Link
                    href="/demo"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white/80 px-8 py-4 font-semibold text-gray-800 backdrop-blur transition hover:border-gray-400 sm:w-auto dark:border-white/20 dark:bg-white/5 dark:text-gray-100 dark:hover:border-white/40"
                  >
                    {t.hero.secondary}
                  </Link>
                </Magnet>
              </Appear>

              <Appear trigger="mount" delay={0.35} distance={8}>
                <p className="mt-5 text-sm text-gray-500">{t.hero.note}</p>
              </Appear>
            </div>

            <div className="px-8 sm:px-0">
              <HeroPhone t={t.hero.phone} />
            </div>
          </div>
        </section>

        <section aria-label={t.features.eyebrow} className="border-y border-gray-100 bg-gray-50/80 py-8 dark:border-white/5 dark:bg-white/[0.02]">
          <Marquee rows={[0, 6].map((start) => t.niches.slice(start, start + 6).map((label, i) => ({ label, icon: NICHE_ICONS[start + i] })))} />
        </section>

        {/* Rəqəmlər */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <Appear stagger={0.08} className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
            {t.stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-4xl font-bold tracking-tight sm:text-6xl">{s.value}</p>
                <p className="mt-2 text-sm text-gray-500 sm:text-base dark:text-gray-400">{s.label}</p>
              </div>
            ))}
          </Appear>
        </section>

        {/* Böyük bəyanat + kataloqa keçid */}
        <section className="mx-auto max-w-5xl px-4 pb-20">
          <ScrollReveal
            baseOpacity={0.22}
            enableBlur={false}
            baseRotation={0}
            wordAnimationEnd="center 55%"
            containerClassName="text-center"
            textClassName="text-balance font-display text-3xl font-bold leading-snug tracking-tight sm:text-5xl sm:leading-tight"
          >
            {t.statement}
          </ScrollReveal>
          <Appear className="mt-10 flex flex-col items-center gap-4 text-center">
            <p className="max-w-xl text-pretty text-gray-600 dark:text-gray-400">{t.catalogCta.text}</p>
            <Link
              href={catalog}
              className="group inline-flex items-center gap-2.5 rounded-full border border-gray-900 bg-gray-900 px-7 py-3.5 font-semibold text-white shadow-xl shadow-gray-900/15 transition hover:-translate-y-0.5 dark:border-white dark:bg-white dark:text-gray-900"
            >
              <Search size={18} strokeWidth={2} aria-hidden />
              {t.catalogCta.button}
              <ArrowRight size={18} strokeWidth={2} className="transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </Appear>
        </section>

        {/* Fərq: DM yazışması və Karvan fakturası */}
        <section className="mx-auto max-w-6xl px-4 pb-28">
          <SectionTitle eyebrow={t.compare.eyebrow} title={t.compare.title} />
          <div className="mt-14 grid items-start gap-6 md:grid-cols-2">
            <Appear>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">{t.compare.before}</p>
              <ChatMock t={t.compare} />
            </Appear>
            <Appear delay={0.1}>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{t.compare.after}</p>
              <InvoiceMock t={t.compare} />
            </Appear>
          </div>
        </section>

        {/* Necə işləyir */}
        <section id="nece-isleyir" className="bg-gray-50/80 py-28 dark:bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-4">
            <SectionTitle eyebrow={t.steps.eyebrow} title={t.steps.title} />
            <div className="mt-16">
              <StepsTimeline steps={t.steps.items.map((s, i) => ({ ...s, icon: <IconBadge icon={STEP_ICONS[i]} size="lg" /> }))} />
            </div>
          </div>
        </section>

        {/* İmkanlar */}
        <section id="imkanlar" className="mx-auto max-w-6xl px-4 py-28">
          <SectionTitle eyebrow={t.features.eyebrow} title={t.features.title} text={t.features.text} />
          <Appear stagger={0.08} className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.features.items.map((f, i) => (
              <div
                key={f.title}
                className="group h-full rounded-3xl border border-gray-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-violet-400/30"
              >
                <span className="inline-block transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <IconBadge icon={FEATURE_ICONS[i]} tone="solid" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{f.text}</p>
              </div>
            ))}
          </Appear>
        </section>

        {/* AI */}
        <section id="ai" className="relative overflow-hidden bg-gray-950 py-28 text-white">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="animate-blob absolute -left-20 top-0 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
            <div className="animate-blob absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-pink-600/25 blur-3xl" style={{ animationDelay: "-9s" }} />
          </div>
          <div className="relative mx-auto max-w-6xl px-4">
            <SectionTitle dark eyebrow={<><Sparkles size={16} strokeWidth={1.75} aria-hidden /> {t.ai.eyebrow}</>} title={t.ai.title} text={t.ai.text} />
            <Appear delay={0.1} className="mt-14">
              <AiDemo t={t.ai.demo} />
            </Appear>
            <Appear stagger={0.1} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {t.ai.items.map((f, i) => (
                <SpotlightCard key={f.title} theme="dark" spotlightColor="rgba(255, 148, 200, 0.22)" className="h-full rounded-2xl p-6">
                  <IconBadge icon={AI_ICONS[i]} size="sm" tone="dark" />
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-400">{f.text}</p>
                </SpotlightCard>
              ))}
            </Appear>
          </div>
        </section>

        {/* Qiymətlər: 3 paket, üzərinə gəldikdə fon dəyişir */}
        <section id="qiymetler" className="mx-auto max-w-6xl px-4 py-28">
          <SectionTitle eyebrow={t.pricing.eyebrow} title={t.pricing.title} text={t.pricing.text} />
          <Appear stagger={0.12} className="mt-16 grid gap-6 lg:grid-cols-3">
            {t.pricing.plans.map((plan, i) => {
              const Icon = PLAN_ICONS[i];
              const popular = i === 1;
              return (
                <div
                  key={plan.name}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border p-8 transition duration-500 hover:-translate-y-1.5 hover:border-transparent hover:shadow-2xl ${
                    popular
                      ? "border-violet-300 bg-white shadow-xl shadow-violet-500/15 hover:shadow-violet-500/30 dark:border-violet-400/40 dark:bg-white/[0.04]"
                      : "border-gray-200 bg-white hover:shadow-gray-900/20 dark:border-white/10 dark:bg-white/[0.03]"
                  }`}
                >
                  <span aria-hidden className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${PLAN_HOVER[i]}`} />
                  <div className="relative flex flex-1 flex-col transition-colors duration-500 group-hover:text-white">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2.5 text-lg font-semibold">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600 transition-colors duration-500 group-hover:bg-white/15 group-hover:text-white dark:bg-white/10 dark:text-violet-300">
                          <Icon size={18} strokeWidth={1.9} aria-hidden />
                        </span>
                        {plan.name}
                      </span>
                      {popular && (
                        <span className="rounded-full bg-gradient-to-r from-violet-600 to-pink-600 px-3 py-1 text-xs font-semibold text-white transition group-hover:bg-none group-hover:bg-white group-hover:text-violet-700">
                          {t.pricing.popular}
                        </span>
                      )}
                    </div>
                    <p className="mt-6 flex items-baseline gap-1.5">
                      <span className="font-display text-5xl font-bold tracking-tight">{PLAN_PRICES[PLAN_KEYS[i]]}</span>
                      <span className="text-gray-500 transition-colors duration-500 group-hover:text-white/70 dark:text-gray-400">{t.common.perMonth}</span>
                    </p>
                    <p className="mt-2 text-gray-600 transition-colors duration-500 group-hover:text-white/80 dark:text-gray-400">{plan.tagline}</p>
                    <ul className="mt-8 flex-1 space-y-3 text-gray-700 transition-colors duration-500 group-hover:text-white dark:text-gray-300">
                      {plan.features.map((f) => (
                        <li key={f} className="flex gap-3">
                          <Check size={18} strokeWidth={2.25} className="mt-0.5 shrink-0 text-violet-600 transition-colors duration-500 group-hover:text-white dark:text-violet-300" aria-hidden />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={i === 0 ? "/signup" : `/signup?plan=${PLAN_KEYS[i]}`}
                      className={`mt-8 rounded-full py-3 text-center font-semibold transition duration-500 ${
                        popular
                          ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-500/30 group-hover:bg-none group-hover:bg-white group-hover:text-violet-700"
                          : "border border-gray-300 group-hover:border-white group-hover:bg-white group-hover:text-gray-900 dark:border-white/20"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              );
            })}
          </Appear>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-gray-500 dark:text-gray-400">{t.pricing.soon}</p>
        </section>

        {/* Suallar */}
        <section id="suallar" className="bg-gray-50/80 py-28 dark:bg-white/[0.02]">
          <div className="mx-auto max-w-3xl px-4">
            <SectionTitle eyebrow={t.faq.eyebrow} title={t.faq.title} />
            <Appear stagger={0.06} distance={30} className="mt-14 space-y-3">
              {t.faq.items.map((item) => (
                <details key={item.q} className="group rounded-2xl border border-gray-200 bg-white px-6 py-5 transition open:shadow-lg open:shadow-violet-500/5 dark:border-white/10 dark:bg-white/[0.03]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                    <h3>{item.q}</h3>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-600 ring-1 ring-gray-200 transition duration-300 group-open:rotate-45 group-open:bg-violet-600 group-open:text-white group-open:ring-violet-600 dark:bg-white/10 dark:text-gray-300 dark:ring-white/10">
                      <Plus size={16} strokeWidth={2} aria-hidden />
                    </span>
                  </summary>
                  <p className="mt-3 text-gray-600 dark:text-gray-400">{item.a}</p>
                </details>
              ))}
            </Appear>
          </div>
        </section>

        {/* Son çağırış */}
        <section className="px-4 py-24">
          <Appear className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 px-6 py-20 text-center text-white shadow-2xl shadow-violet-500/30 sm:px-16">
            <div aria-hidden className="animate-blob absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
            <div aria-hidden className="animate-blob absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-amber-300/20 blur-2xl" style={{ animationDelay: "-7s" }} />
            <h2 className="relative text-balance text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{t.cta.title}</h2>
            <p className="relative mx-auto mt-5 max-w-xl text-lg text-violet-100">{t.cta.text}</p>
            <div className="relative mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Magnet padding={70} magnetStrength={3} wrapperClassName="w-full sm:w-auto">
                <Link href="/signup" className="inline-block w-full rounded-full bg-white px-9 py-4 font-semibold text-violet-700 shadow-xl sm:w-auto">
                  {t.cta.primary}
                </Link>
              </Magnet>
              <Link href="/demo" className="w-full rounded-full border border-white/40 px-9 py-4 font-semibold text-white transition hover:bg-white/10 sm:w-auto">
                {t.cta.secondary}
              </Link>
            </div>
          </Appear>
        </section>

        <SiteFooter locale={locale} t={t} paths={HOME_PATH} />
      </div>
    </SmoothScroll>
  );
}
