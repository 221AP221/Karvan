import Link from "next/link";
import { AiDemo } from "@/components/landing/AiDemo";
import { Header, Logo } from "@/components/landing/Header";
import { HeroPhone } from "@/components/landing/HeroPhone";
import { Reveal } from "@/components/landing/Reveal";

const NICHES = [
  "Makiyaj ustaları",
  "Repetitorlar",
  "Dizaynerlər",
  "SMM mütəxəssisləri",
  "Fotoqraflar",
  "Fitness məşqçiləri",
  "Psixoloqlar",
  "Konsultantlar",
  "Dırnaq ustaları",
  "Reklam bloqerləri",
];

const STEPS = [
  {
    title: "Səhifənizi qurun",
    text: "Ad, bio, sosial linklər və xidmətlərinizi əlavə edin. biofaktura.az/adiniz hazırdır.",
    icon: "🎨",
  },
  {
    title: "Linki bio-ya qoyun",
    text: "Instagram və TikTok profilinizə əlavə edin. Müştəri xidməti seçib bir kliklə sifariş verir.",
    icon: "🔗",
  },
  {
    title: "Ödənişi izləyin",
    text: "Faktura avtomatik yaranır, müştəri ödəyir, siz paneldə bir baxışda kimin ödədiyini görürsünüz.",
    icon: "📈",
  },
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
  {
    q: "Pulsuzdurmu?",
    a: "Bəli. Pulsuz planda səhifəniz, limitsiz sifariş və ayda 5 faktura var. Kart məlumatı tələb olunmur.",
  },
  {
    q: "Müştəri pulu kimə ödəyir?",
    a: "Birbaşa sizə. Fakturada sizin kart və ya IBAN rekvizitləriniz göstərilir, BioFaktura pulunuza toxunmur.",
  },
  {
    q: "Faktura rəsmi vergi sənədidirmi?",
    a: "Xeyr, bu peşəkar ödəniş sorğusudur. VOEN və e-qaimə dəstəyi gələcək versiyalarda planlaşdırılır.",
  },
  {
    q: "Texniki bilik lazımdırmı?",
    a: "Yox. Səhifəni bir neçə dəqiqəyə forma dolduraraq qurursunuz, hər şey Azərbaycan dilindədir.",
  },
  {
    q: "Ödənişin gəldiyini necə bilirəm?",
    a: "Müştəri “Ödədim” basanda paneldə görünür. Hesabınızı yoxlayıb bir kliklə təsdiqləyirsiniz.",
  },
];

export default function Home() {
  return (
    <div className="overflow-x-hidden bg-white text-gray-900">
      <Header />

      {/* Hero */}
      <section className="relative pt-28 sm:pt-36">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
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

        <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-4 pb-20 lg:grid-cols-[1.1fr_1fr]">
          <div className="text-center lg:text-left">
            <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-1.5 text-sm text-violet-700 shadow-sm backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-600" />
              </span>
              Azərbaycanda xidmət satanlar üçün
            </span>
            <h1
              className="animate-fade-up mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "0.1s" }}
            >
              Profil linkiniz <span className="text-gradient">artıq satış edir</span>
            </h1>
            <p
              className="animate-fade-up mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-600 lg:mx-0"
              style={{ animationDelay: "0.2s" }}
            >
              Instagram bio-nuz üçün bir link: xidmətləriniz, sifariş düyməsi, avtomatik PDF faktura və ödəniş izləmə.
              DM-də kart nömrəsi yazmağa son.
            </p>
            <div
              className="animate-fade-up mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
              style={{ animationDelay: "0.3s" }}
            >
              <Link
                href="/signup"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 px-7 py-3.5 font-semibold text-white shadow-xl shadow-violet-500/30 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-500/40 sm:w-auto"
              >
                Pulsuz başla
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/demo"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-7 py-3.5 font-semibold text-gray-800 transition hover:-translate-y-0.5 hover:border-gray-400 sm:w-auto"
              >
                Demo səhifəyə bax
              </Link>
            </div>
            <p className="animate-fade-up mt-5 text-sm text-gray-500" style={{ animationDelay: "0.4s" }}>
              Kart tələb olunmur · Ayda 5 faktura pulsuz · 3 dəqiqəyə hazır
            </p>
          </div>

          <div className="animate-fade-up px-8 sm:px-0" style={{ animationDelay: "0.25s" }}>
            <HeroPhone />
          </div>
        </div>
      </section>

      {/* Kimlər üçün */}
      <section aria-label="Kimlər üçün" className="border-y border-gray-100 bg-gray-50/80 py-6">
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="animate-marquee flex w-max gap-10 pr-10">
            {[...NICHES, ...NICHES].map((niche, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap text-lg font-medium text-gray-400">
                {niche}
                <span className="text-violet-300">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem / həll */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tanış gəlir?</h2>
          <p className="mt-4 text-lg text-gray-600">Hər sifarişdə eyni yazışma, eyni sual, eyni qarışıqlıq.</p>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Reveal className="rounded-3xl border border-red-100 bg-gradient-to-b from-red-50/80 to-white p-7">
            <p className="text-sm font-semibold uppercase tracking-wider text-red-500">Əvvəl</p>
            <ul className="mt-5 space-y-4 text-gray-700">
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
          </Reveal>
          <Reveal delay={120} className="rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50/80 to-white p-7">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">BioFaktura ilə</p>
            <ul className="mt-5 space-y-4 text-gray-700">
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
          </Reveal>
        </div>
      </section>

      {/* Necə işləyir */}
      <section id="nece-isleyir" className="bg-gray-50/80 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">Necə işləyir</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Üç addımda ilk ödəniş</h2>
          </Reveal>
          <ol className="relative mt-14 grid gap-8 md:grid-cols-3">
            <div aria-hidden className="absolute left-[16%] right-[16%] top-8 hidden h-0.5 bg-gradient-to-r from-violet-200 via-pink-200 to-amber-200 md:block" />
            {STEPS.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 150} className="relative text-center">
                <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-3xl shadow-lg shadow-violet-500/10 ring-1 ring-gray-200">
                  {step.icon}
                  <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-gray-900 text-xs font-bold text-white">{i + 1}</span>
                </span>
                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-gray-600">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Xüsusiyyətlər */}
      <section id="xususiyyetler" className="mx-auto max-w-6xl px-4 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">Xüsusiyyətlər</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Satış üçün lazım olan hər şey</h2>
          <p className="mt-4 text-lg text-gray-600">Linktree, Excel və WhatsApp yazışmalarını bir alətlə əvəz edin.</p>
        </Reveal>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 100}>
              <div className="group h-full rounded-3xl border border-gray-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/10">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-50 to-pink-50 text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  {f.icon}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-gray-600">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* AI */}
      <section id="ai" className="relative overflow-hidden bg-gray-950 py-24 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="animate-blob absolute -left-20 top-0 h-80 w-80 rounded-full bg-violet-600/30 blur-3xl" />
          <div className="animate-blob absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-pink-600/25 blur-3xl" style={{ animationDelay: "-9s" }} />
        </div>
        <div className="relative mx-auto max-w-6xl px-4">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-300">✨ Süni intellekt</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Yazın, AI fakturanı hazırlasın</h2>
            <p className="mt-4 text-lg text-gray-400">
              Formaları doldurmaq lazım deyil. Müştəri ilə razılaşdığınızı adi dillə yazın, qalanını AI edir. Göndərməzdən əvvəl
              hər şeyi siz yoxlayırsınız.
            </p>
          </Reveal>
          <Reveal delay={150} className="mt-12">
            <AiDemo />
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AI_FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 100} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:bg-white/10">
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{f.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Qiymətlər */}
      <section id="qiymetler" className="mx-auto max-w-6xl px-4 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">Qiymətlər</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Pulsuz başlayın, böyüdükcə keçin</h2>
        </Reveal>
        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          <Reveal className="flex flex-col rounded-3xl border border-gray-200 bg-white p-8">
            <h3 className="text-lg font-semibold">Pulsuz</h3>
            <p className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold tracking-tight">0</span>
              <span className="text-gray-500">AZN / ay</span>
            </p>
            <p className="mt-2 text-gray-600">Yeni başlayanlar üçün</p>
            <ul className="mt-8 flex-1 space-y-3 text-gray-700">
              {["Link-in-bio səhifə", "Limitsiz sifariş", "Ayda 5 faktura", "PDF faktura və QR kod", "WhatsApp ilə göndərmə", "Ayda 10 AI sorğusu"].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="text-violet-600">✓</span>
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="mt-8 rounded-full border border-gray-300 py-3 text-center font-semibold transition hover:border-gray-900 hover:bg-gray-900 hover:text-white">
              Pulsuz başla
            </Link>
          </Reveal>

          <Reveal delay={120} className="relative flex flex-col rounded-3xl bg-gradient-to-b from-violet-600 to-pink-600 p-[1.5px] shadow-2xl shadow-violet-500/25">
            <div className="flex flex-1 flex-col rounded-[calc(1.5rem-1.5px)] bg-white p-8">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 px-3 py-1 text-xs font-semibold text-white">
                Tezliklə
              </span>
              <h3 className="text-lg font-semibold">Pro</h3>
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
          </Reveal>
        </div>
      </section>

      {/* Suallar */}
      <section id="suallar" className="bg-gray-50/80 py-24">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">Suallar</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Tez-tez soruşulanlar</h2>
          </Reveal>
          <div className="mt-12 space-y-3">
            {FAQ.map((item, i) => (
              <Reveal key={item.q} delay={i * 60}>
                <details className="group rounded-2xl border border-gray-200 bg-white px-6 py-5 transition open:shadow-lg open:shadow-violet-500/5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-600 transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-gray-600">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Son çağırış */}
      <section className="px-4 py-24">
        <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 px-6 py-16 text-center text-white shadow-2xl shadow-violet-500/30 sm:px-16">
          <div aria-hidden className="animate-blob absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
          <div aria-hidden className="animate-blob absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-amber-300/20 blur-2xl" style={{ animationDelay: "-7s" }} />
          <h2 className="relative text-3xl font-bold tracking-tight sm:text-5xl">Növbəti sifarişiniz fakturası ilə gəlsin</h2>
          <p className="relative mx-auto mt-5 max-w-xl text-lg text-violet-100">
            Səhifənizi indi qurun, linki bio-ya qoyun, ilk müştəriniz peşəkar faktura alsın.
          </p>
          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="w-full rounded-full bg-white px-8 py-3.5 font-semibold text-violet-700 shadow-xl transition hover:-translate-y-0.5 sm:w-auto">
              Pulsuz hesab yarat
            </Link>
            <Link href="/demo" className="w-full rounded-full border border-white/40 px-8 py-3.5 font-semibold text-white transition hover:bg-white/10 sm:w-auto">
              Demo səhifə
            </Link>
          </div>
        </Reveal>
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
          <p>© {new Date().getFullYear()} BioFaktura</p>
        </div>
      </footer>
    </div>
  );
}
