import Link from "next/link";
import { AiDemo } from "@/components/landing/AiDemo";
import { Appear } from "@/components/landing/Appear";
import { Header, Logo } from "@/components/landing/Header";
import { HeroPhone } from "@/components/landing/HeroPhone";
import { Marquee } from "@/components/landing/Marquee";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { StepsTimeline } from "@/components/landing/StepsTimeline";
import { WordRotator } from "@/components/landing/WordRotator";
import GradientText from "@/components/reactbits/GradientText";
import Magnet from "@/components/reactbits/Magnet";
import ScrollReveal from "@/components/reactbits/ScrollReveal";
import ShinyText from "@/components/reactbits/ShinyText";
import SplitText from "@/components/reactbits/SplitText";
import SpotlightCard from "@/components/reactbits/SpotlightCard";

const BRAND_GRADIENT = ["#7c3aed", "#db2777", "#f59e0b", "#7c3aed"];

const NICHES = [
  ["💄 Makiyaj ustaları", "📚 Repetitorlar", "🎨 Dizaynerlər", "📣 SMM mütəxəssisləri", "📸 Fotoqraflar", "💅 Dırnaq ustaları"],
  ["🏋️ Fitness məşqçiləri", "🧠 Psixoloqlar", "💼 Konsultantlar", "📢 Reklam bloqerləri", "🎬 Video montajçılar", "🌐 Tərcüməçilər"],
];

const STATS = [
  { value: "3 dəq", label: "səhifəni qurmaq üçün" },
  { value: "5", label: "pulsuz faktura hər ay" },
  { value: "0 AZN", label: "başlamaq üçün" },
  { value: "24/7", label: "sifariş qəbulu" },
];

const STEPS = [
  { icon: "🎨", title: "Səhifənizi qurun", text: "Ad, bio, sosial linklər və xidmətlərinizi əlavə edin. biofaktura.az/adiniz bir neçə dəqiqəyə hazırdır." },
  { icon: "🔗", title: "Linki bio-ya qoyun", text: "Instagram və TikTok profilinizə əlavə edin. Müştəri xidməti seçib bir kliklə sifariş verir." },
  { icon: "📄", title: "Faktura avtomatik gedir", text: "Sabit qiymətdə dərhal, “razılaşma ilə” xidmətdə siz təsdiqləyəndə. Rekvizitlər, QR kod, PDF — hamısı içində." },
  { icon: "📈", title: "Ödənişi izləyin", text: "Müştəri “Ödədim” basır, siz bir kliklə təsdiqləyirsiniz. Kim ödəyib, kim gecikir — bir ekranda." },
];

const FEATURES = [
  { icon: "📱", title: "Link-in-bio səhifə", text: "Sosial linklər və xidmətlər bir yerdə, brend rənginizlə, telefona uyğun." },
  { icon: "🛒", title: "Sifariş formu", text: "Sabit qiymətdə faktura dərhal yaranır, “razılaşma ilə” xidmətdə siz təsdiqləyirsiniz." },
  { icon: "📄", title: "PDF faktura", text: "Nömrələnmiş, QR kodlu, peşəkar faktura. Müştəri onlayn baxır və ya yükləyir." },
  { icon: "💳", title: "Rekvizitlər", text: "Kart və IBAN fakturada görünür, müştəri bir kliklə kopyalayır və “Ödədim” basır." },
  { icon: "💬", title: "WhatsApp ilə göndər", text: "Faktura linki hazır mətnlə WhatsApp-a gedir. Kopyala-yapışdır yoxdur." },
  { icon: "📊", title: "Ödəniş paneli", text: "Bu ay nə qədər qazandınız, kim gecikir, nə gözlənilir: hamısı bir ekranda." },
];

const AI_FEATURES = [
  { title: "Mətndən faktura", text: "Necə danışırsınızsa, elə yazın. AI müştərini, xidməti və məbləği tapır." },
  { title: "Xidmət təsviri", text: "Bir neçə açar söz yazın, AI 3 satış mətni təklif etsin." },
  { title: "Brend rəngi", text: "Sahənizə uyğun rəng palitrasını AI seçir." },
  { title: "Nəzakətli xatırlatma", text: "Ödəniş gecikəndə AI uyğun tonda WhatsApp mesajı yazır." },
];

const FAQ = [
  { q: "Pulsuzdurmu?", a: "Bəli. Pulsuz planda səhifəniz, limitsiz sifariş və ayda 5 faktura var. Kart məlumatı tələb olunmur." },
  { q: "Müştəri pulu kimə ödəyir?", a: "Birbaşa sizə. Fakturada sizin kart və ya IBAN rekvizitləriniz göstərilir, BioFaktura pulunuza toxunmur." },
  { q: "Faktura rəsmi vergi sənədidirmi?", a: "Xeyr, bu peşəkar ödəniş sorğusudur. VOEN və e-qaimə dəstəyi gələcək versiyalarda planlaşdırılır." },
  { q: "Texniki bilik lazımdırmı?", a: "Yox. Səhifəni bir neçə dəqiqəyə forma dolduraraq qurursunuz, hər şey Azərbaycan dilindədir." },
  { q: "Ödənişin gəldiyini necə bilirəm?", a: "Müştəri “Ödədim” basanda paneldə görünür. Hesabınızı yoxlayıb bir kliklə təsdiqləyirsiniz." },
];

function SectionTitle({ eyebrow, title, text, dark = false }: { eyebrow: string; title: string; text?: string; dark?: boolean }) {
  return (
    <Appear stagger={0.08} className="mx-auto max-w-3xl text-center">
      <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${dark ? "text-violet-300" : "text-violet-600"}`}>{eyebrow}</p>
      <h2 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-tight sm:text-5xl sm:leading-[1.1]">{title}</h2>
      {text && <p className={`mt-5 text-pretty text-lg ${dark ? "text-gray-400" : "text-gray-600"}`}>{text}</p>}
    </Appear>
  );
}

export default function Home() {
  return (
    <SmoothScroll>
      <div className="overflow-x-clip bg-white text-gray-900">
        <Header />

        {/* Hero */}
        <section className="relative pt-28 sm:pt-36">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="animate-blob absolute -left-32 -top-24 h-96 w-96 rounded-full bg-violet-300/40 blur-3xl" />
            <div className="animate-blob absolute -right-24 top-20 h-96 w-96 rounded-full bg-pink-300/40 blur-3xl" style={{ animationDelay: "-6s" }} />
            <div
              className="absolute inset-0 opacity-[0.35]"
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
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-1.5 text-sm shadow-sm backdrop-blur">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-600" />
                  </span>
                  <ShinyText text="Azərbaycanda xidmət satanlar üçün" color="#6d28d9" shineColor="#f0abfc" speed={3} />
                </span>
              </Appear>

              <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
                <SplitText
                  text="Profil linkiniz"
                  tag="span"
                  trigger="load"
                  splitType="chars"
                  effect="rise"
                  delay={22}
                  duration={0.7}
                  textAlign="inherit"
                  className="block pb-1"
                />
                <WordRotator words={["satış edir", "faktura yazır", "ödənişi izləyir"]} className="mt-1" />
              </h1>

              <Appear trigger="mount" delay={0.15}>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-600 lg:mx-0">
                  Instagram bio-nuz üçün bir link: xidmətləriniz, sifariş düyməsi, avtomatik PDF faktura və ödəniş izləmə.
                  DM-də kart nömrəsi yazmağa son.
                </p>
              </Appear>

              <Appear
                trigger="mount"
                delay={0.25}
                stagger={0.08}
                className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
              >
                <Magnet padding={60} magnetStrength={3} wrapperClassName="w-full sm:w-auto">
                  <Link
                    href="/signup"
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 px-8 py-4 font-semibold text-white shadow-xl shadow-violet-500/30 transition-shadow hover:shadow-2xl hover:shadow-violet-500/40 sm:w-auto"
                  >
                    Pulsuz başla
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </Magnet>
                <Magnet padding={40} magnetStrength={4} wrapperClassName="w-full sm:w-auto">
                  <Link
                    href="/demo"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white/80 px-8 py-4 font-semibold text-gray-800 backdrop-blur transition hover:border-gray-400 sm:w-auto"
                  >
                    Demo səhifəyə bax
                  </Link>
                </Magnet>
              </Appear>

              <Appear trigger="mount" delay={0.35} distance={8}>
                <p className="mt-5 text-sm text-gray-500">Kart tələb olunmur · Ayda 5 faktura pulsuz · 3 dəqiqəyə hazır</p>
              </Appear>
            </div>

            <div className="px-8 sm:px-0">
              <HeroPhone />
            </div>
          </div>
        </section>

        {/* Kimlər üçün: scroll sürətinə reaksiya verən zolaq */}
        <section aria-label="Kimlər üçün" className="border-y border-gray-100 bg-gray-50/80 py-8">
          <Marquee rows={NICHES} />
        </section>

        {/* Rəqəmlər */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <Appear stagger={0.08} className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-extrabold tracking-tight sm:text-6xl">{s.value}</p>
                <p className="mt-2 text-sm text-gray-500 sm:text-base">{s.label}</p>
              </div>
            ))}
          </Appear>
        </section>

        {/* Böyük bəyanat: söz-söz açılır */}
        <section className="mx-auto max-w-5xl px-4 pb-24">
          <ScrollReveal
            baseOpacity={0.22}
            enableBlur={false}
            baseRotation={0}
            wordAnimationEnd="center 55%"
            containerClassName="text-center"
            textClassName="text-balance text-3xl font-bold leading-snug tracking-tight sm:text-5xl sm:leading-tight"
          >
            Müştəriləriniz DM-də kart nömrəsi gözləmir. Onlar aydın qiymət, bir kliklə sifariş və peşəkar faktura gözləyir.
          </ScrollReveal>
        </section>

        {/* Problem / həll */}
        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-6 md:grid-cols-2">
            <Appear className="rounded-3xl border border-red-100 bg-gradient-to-b from-red-50/80 to-white p-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-red-500">Əvvəl</p>
              <ul className="mt-6 space-y-4 text-gray-700">
                {[
                  "“Qiyməti nədir?” sualına hər dəfə ayrıca cavab",
                  "DM-də kart nömrəsi, IBAN, məbləğ yazmaq",
                  "“Göndərdim” yazışması və ekran görüntüləri",
                  "Kim ödəyib, kim yox: dəftərdə və ya yaddaşda",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-100 text-xs text-red-600">✕</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Appear>
            <Appear delay={0.08} className="rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50/80 to-white p-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">BioFaktura ilə</p>
              <ul className="mt-6 space-y-4 text-gray-700">
                {[
                  "Qiymətlər və xidmətlər səhifənizdə aydın görünür",
                  "Faktura rekvizitlərlə birlikdə avtomatik yaranır",
                  "Müştəri “Ödədim” basır, siz bir kliklə təsdiqləyirsiniz",
                  "Panel: qazanılan, gözlənilən və gecikən məbləğlər",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs text-emerald-700">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Appear>
          </div>
        </section>

        {/* Necə işləyir */}
        <section id="nece-isleyir" className="bg-gray-50/80 py-28">
          <div className="mx-auto max-w-6xl px-4">
            <SectionTitle eyebrow="Necə işləyir" title="Dörd addımda ilk ödəniş" />
            <div className="mt-16">
              <StepsTimeline steps={STEPS} />
            </div>
          </div>
        </section>

        {/* Xüsusiyyətlər */}
        <section id="xususiyyetler" className="mx-auto max-w-6xl px-4 py-28">
          <SectionTitle
            eyebrow="Xüsusiyyətlər"
            title="Satış üçün lazım olan hər şey"
            text="Linktree, Excel və WhatsApp yazışmalarını bir alətlə əvəz edin."
          />
          <Appear stagger={0.08} className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <SpotlightCard key={f.title} theme="light" spotlightColor="rgba(124, 58, 237, 0.18)" className="h-full rounded-3xl p-7">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-50 to-pink-50 text-2xl">{f.icon}</span>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-gray-600">{f.text}</p>
              </SpotlightCard>
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
            <SectionTitle
              dark
              eyebrow="✨ Süni intellekt"
              title="Yazın, AI fakturanı hazırlasın"
              text="Formaları doldurmaq lazım deyil. Razılaşdığınızı adi dillə yazın, qalanını AI edir. Göndərməzdən əvvəl hər şeyi siz yoxlayırsınız."
            />
            <Appear delay={0.1} className="mt-14">
              <AiDemo />
            </Appear>
            <Appear stagger={0.1} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {AI_FEATURES.map((f) => (
                <SpotlightCard key={f.title} theme="dark" spotlightColor="rgba(167, 139, 250, 0.25)" className="h-full rounded-2xl p-6">
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-400">{f.text}</p>
                </SpotlightCard>
              ))}
            </Appear>
          </div>
        </section>

        {/* Qiymətlər */}
        <section id="qiymetler" className="mx-auto max-w-6xl px-4 py-28">
          <SectionTitle eyebrow="Qiymətlər" title="Pulsuz başlayın, böyüdükcə keçin" />
          <Appear stagger={0.15} className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-3xl border border-gray-200 bg-white p-8">
              <h3 className="text-lg font-semibold">Pulsuz</h3>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight">0</span>
                <span className="text-gray-500">AZN / ay</span>
              </p>
              <p className="mt-2 text-gray-600">Yeni başlayanlar üçün</p>
              <ul className="mt-8 flex-1 space-y-3 text-gray-700">
                {["Link-in-bio səhifə", "Limitsiz sifariş", "Ayda 5 faktura", "PDF faktura və QR kod", "WhatsApp ilə göndərmə", "AI köməkçisi"].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="text-violet-600">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 rounded-full border border-gray-300 py-3 text-center font-semibold transition hover:border-gray-900 hover:bg-gray-900 hover:text-white">
                Pulsuz başla
              </Link>
            </div>

            <div className="relative flex flex-col rounded-3xl bg-gradient-to-b from-violet-600 to-pink-600 p-[1.5px] shadow-2xl shadow-violet-500/25">
              <div className="flex flex-1 flex-col rounded-[calc(1.5rem-1.5px)] bg-white p-8">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 px-3 py-1 text-xs font-semibold text-white">
                  Tezliklə
                </span>
                <h3 className="text-lg font-semibold">
                  <GradientText colors={BRAND_GRADIENT} animationSpeed={5}>Pro</GradientText>
                </h3>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold tracking-tight">14,90</span>
                  <span className="text-gray-500">AZN / ay</span>
                </p>
                <p className="mt-2 text-gray-600">Aktiv satanlar üçün</p>
                <ul className="mt-8 flex-1 space-y-3 text-gray-700">
                  {["Pulsuz plandakı hər şey", "Limitsiz faktura", "Öz loqonuz, BioFaktura yazısı yoxdur", "Onlayn kartla ödəniş", "SMS və avtomatik xatırlatmalar", "Genişləndirilmiş AI"].map((t) => (
                    <li key={t} className="flex gap-3">
                      <span className="text-pink-600">✓</span>
                      {t}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="mt-8 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 py-3 text-center font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:-translate-y-0.5"
                >
                  Pulsuz başla, sonra keç
                </Link>
              </div>
            </div>
          </Appear>
        </section>

        {/* Suallar */}
        <section id="suallar" className="bg-gray-50/80 py-28">
          <div className="mx-auto max-w-3xl px-4">
            <SectionTitle eyebrow="Suallar" title="Tez-tez soruşulanlar" />
            <Appear stagger={0.08} distance={30} className="mt-14 space-y-3">
              {FAQ.map((item) => (
                <details key={item.q} className="group rounded-2xl border border-gray-200 bg-white px-6 py-5 transition open:shadow-lg open:shadow-violet-500/5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-600 transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-gray-600">{item.a}</p>
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
            <h2 className="relative text-balance text-3xl font-bold leading-tight tracking-tight sm:text-5xl">Növbəti sifarişiniz fakturası ilə gəlsin</h2>
            <p className="relative mx-auto mt-5 max-w-xl text-lg text-violet-100">
              Səhifənizi indi qurun, linki bio-ya qoyun, ilk müştəriniz peşəkar faktura alsın.
            </p>
            <div className="relative mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Magnet padding={70} magnetStrength={3} wrapperClassName="w-full sm:w-auto">
                <Link href="/signup" className="inline-block w-full rounded-full bg-white px-9 py-4 font-semibold text-violet-700 shadow-xl sm:w-auto">
                  Pulsuz hesab yarat
                </Link>
              </Magnet>
              <Link href="/demo" className="w-full rounded-full border border-white/40 px-9 py-4 font-semibold text-white transition hover:bg-white/10 sm:w-auto">
                Demo səhifə
              </Link>
            </div>
          </Appear>
        </section>

        <footer className="border-t border-gray-100">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 text-sm text-gray-500 md:flex-row">
            <Logo />
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <a href="#nece-isleyir" className="hover:text-gray-900">Necə işləyir</a>
              <a href="#xususiyyetler" className="hover:text-gray-900">Xüsusiyyətlər</a>
              <a href="#qiymetler" className="hover:text-gray-900">Qiymətlər</a>
              <Link href="/login" className="hover:text-gray-900">Daxil ol</Link>
              <Link href="/signup" className="hover:text-gray-900">Qeydiyyat</Link>
            </nav>
            <p>© 2026 BioFaktura</p>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
}
