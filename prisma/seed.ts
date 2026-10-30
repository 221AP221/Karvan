import { hashPassword } from "../src/lib/auth";
import { db } from "../src/lib/db";

// Rebrenddən əvvəlki demo hesab (demo@biofaktura.az) varsa, e-poçtu yenilənir.
// Arada profilsiz yeni demo hesab yaranıbsa, o silinir ki, köhnə hesab (profili ilə) köçə bilsin.
const OLD_DEMO = "demo@biofaktura.az";
const DEMO = "demo@karvan.az";
const oldDemo = await db.user.findUnique({ where: { email: OLD_DEMO }, select: { id: true } });
if (oldDemo) {
  const newDemo = await db.user.findUnique({ where: { email: DEMO }, select: { id: true, profile: { select: { id: true } } } });
  if (newDemo && !newDemo.profile) await db.user.delete({ where: { id: newDemo.id } });
  if (!newDemo || !newDemo.profile) await db.user.update({ where: { id: oldDemo.id }, data: { email: DEMO } });
}

const user = await db.user.upsert({
  where: { email: DEMO },
  update: {},
  create: {
    email: DEMO,
    passwordHash: await hashPassword("demo12345"),
    subscription: { create: { plan: "FREE" } },
  },
});

// Seed hər "npm run dev"-də işləyir: mövcud demo səhifədə istifadəçinin dəyişikliklərinə toxunmuruq
const existed = await db.profile.findUnique({ where: { username: "demo" }, select: { id: true } });

const profile = await db.profile.upsert({
  where: { username: "demo" },
  update: {},
  create: {
    userId: user.id,
    username: "demo",
    displayName: "Aygün Məmmədova",
    profession: "İngilis dili müəllimi",
    city: "Bakı",
    bio: "Fərdi və onlayn dərslər · IELTS hazırlığı",
    about:
      "8 ildir ingilis dili tədris edirəm. Cambridge CELTA sertifikatım var, 300-dən çox tələbəm IELTS imtahanından 6.5+ bal alıb.\n\nDərslər fərdi və onlayn keçirilir. Hər tələbə üçün səviyyəsinə uyğun plan hazırlayıram.",
    invoicePrefix: "AYG",
    theme: { primary: "#D6127E" },
    cardNumber: "4169 0000 0000 1234",
    bankName: "Kapital Bank",
    accountName: "Aygün Məmmədova",
    socialLinks: {
      create: [
        { platform: "INSTAGRAM", url: "https://instagram.com/demo", position: 0 },
        { platform: "WHATSAPP", url: "https://wa.me/994501234567", position: 2 },
        { platform: "TELEGRAM", url: "https://t.me/demo", position: 3 },
        { platform: "CUSTOM", label: "Pulsuz səviyyə testi", url: "https://forms.gle/demo", position: 100 },
      ],
    },
    services: {
      create: [
        { title: "Fərdi dərs (60 dəq)", priceType: "FIXED", amountQepik: 5000, duration: "60 dəq", position: 0 },
        { title: "IELTS hazırlıq kursu", priceType: "NEGOTIABLE", duration: "8 həftə", position: 1 },
      ],
    },
  },
});

if (!existed) {
  await db.portfolioItem.createMany({
    data: [
      { profileId: profile.id, position: 0, title: "IELTS 7.5 — Nigar", description: "3 aylıq intensiv hazırlıq, Speaking 5.5-dən 7.5-ə." },
      { profileId: profile.id, position: 1, title: "Korporativ kurs — Kapital Bank", description: "12 əməkdaş üçün Business English qrupu." },
      { profileId: profile.id, position: 2, title: "Uşaqlar üçün yay məktəbi", description: "8-12 yaş, oyunlarla danışıq praktikası." },
    ],
  });
}

// Əvvəlki versiyada demo Pro-ya keçirilmişdisə, indi bütün imkanları göstərmək üçün Pro Max
await db.subscription.updateMany({ where: { userId: user.id, plan: "PRO" }, data: { plan: "PRO_MAX" } });

await seedAnalytics(profile.id);
await seedCatalogSellers();

// Lokal admin hesabı (real bazada yaradılmır: orada `npm run admin -- e-poçt şifrə` istifadə olunur)
if (!process.env.DATABASE_URL && !(await db.user.findUnique({ where: { email: "admin@karvan.az" }, select: { id: true } }))) {
  await db.user.create({ data: { email: "admin@karvan.az", firstName: "Karvan", lastName: "Admin", role: "SUPER_ADMIN", passwordHash: await hashPassword("admin12345") } });
}

console.log("Demo profil: /demo · giriş: demo@karvan.az / demo12345");
if (!process.env.DATABASE_URL) console.log("Admin panel: /admin · giriş: admin@karvan.az / admin12345");

// Demo analitika: son 90 gündə ziyarətlər, sifarişlər və fakturalar (yalnız bir dəfə, hadisə yoxdursa).
// Demo hesab Pro Max plana keçirilir: 90 günlük nümunə fakturalar pulsuz planın aylıq limitinə sığmır.
async function seedAnalytics(profileId: string) {
  if (await db.profileEvent.count({ where: { profileId } })) return;
  const current = await db.profile.findUniqueOrThrow({ where: { id: profileId }, select: { phone: true } });
  if (!current.phone) await db.profile.update({ where: { id: profileId }, data: { phone: "+994501234567" } });
  await db.subscription.updateMany({ where: { user: { profile: { id: profileId } } }, data: { plan: "PRO_MAX" } });

  let seed = 20261030;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T,>(weights: [T, number][]) => {
    let x = rnd() * weights.reduce((s, [, w]) => s + w, 0);
    for (const [v, w] of weights) if ((x -= w) <= 0) return v;
    return weights[0][0];
  };

  const services = await db.service.findMany({ where: { profileId, isActive: true } });
  const fixed = services.filter((s) => s.priceType === "FIXED" && s.amountQepik !== null && s.amountQepik <= 100_000);
  const negotiable = services.filter((s) => s.priceType === "NEGOTIABLE");
  const profile = await db.profile.findUniqueOrThrow({ where: { id: profileId } });
  let seq = profile.invoiceSeq;

  const NAMES = ["Nigar Əliyeva", "Kamran Hüseynov", "Lalə Quliyeva", "Orxan Məmmədov", "Səbinə Rzayeva", "Elvin Babayev", "Günay İsmayılova", "Fərid Kərimov", "Aysel Nəsibova", "Tural Qasımov", "Ülviyyə Həsənli", "Rəşad Abbasov", "Nərmin Cəfərova", "Murad Əhmədov", "Zəhra Vəliyeva", "Emil Salahov"];
  const customers = NAMES.map((name, i) => ({ name, phone: `+99450${String(3000000 + i * 7919).slice(0, 7)}` }));

  const now = new Date();
  const visitors: string[] = [];
  const events: { profileId: string; type: "VIEW" | "ORDER_OPEN" | "PHONE_CLICK" | "LINK_CLICK"; visitorId: string; source: string; device: string; target: string | null; createdAt: Date }[] = [];

  for (let d = 89; d >= 0; d--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    const views = Math.round((8 + (89 - d) * 0.22) * (weekend ? 1.3 : 1) * (0.7 + rnd() * 0.6));
    for (let v = 0; v < views; v++) {
      const at = new Date(day.getTime() + (9 + rnd() * 14) * 3_600_000);
      if (at > now) continue;
      const returning = visitors.length > 20 && rnd() < 0.22;
      const visitorId = returning ? visitors[Math.floor(rnd() * visitors.length)] : `demo${Math.floor(rnd() * 1e12).toString(36)}`;
      if (!returning) visitors.push(visitorId);
      const source = pick<string>([["instagram", 46], ["tiktok", 21], ["whatsapp", 11], ["direct", 11], ["telegram", 5], ["search", 4], ["facebook", 2]]);
      const device = rnd() < 0.83 ? "mobile" : "desktop";
      const base = { profileId, visitorId, source, device };
      events.push({ ...base, type: "VIEW", target: null, createdAt: at });
      if (rnd() < 0.05) events.push({ ...base, type: "PHONE_CLICK", target: null, createdAt: new Date(at.getTime() + 40_000) });
      if (rnd() < 0.09) events.push({ ...base, type: "LINK_CLICK", target: pick([["INSTAGRAM", 5], ["WHATSAPP", 4], ["TELEGRAM", 1]]), createdAt: new Date(at.getTime() + 30_000) });

      const conv = source === "whatsapp" ? 0.24 : source === "instagram" ? 0.14 : 0.09;
      if (!services.length || rnd() > conv) continue;
      const service = negotiable.length && (!fixed.length || rnd() < 0.3) ? negotiable[Math.floor(rnd() * negotiable.length)] : fixed[Math.floor(rnd() * fixed.length)];
      if (!service) continue;
      const openedAt = new Date(at.getTime() + 60_000);
      events.push({ ...base, type: "ORDER_OPEN", target: service.id, createdAt: openedAt });
      if (rnd() > 0.45) continue;

      const ageDays = (now.getTime() - at.getTime()) / 86_400_000;
      const customer = rnd() < 0.3 ? customers[Math.floor(rnd() * 5)] : customers[Math.floor(rnd() * customers.length)];
      const createdAt = new Date(openedAt.getTime() + 120_000);
      const isFixed = service.priceType === "FIXED";
      const wantsInvoice = isFixed || (ageDays > 3 && rnd() < 0.8);
      const status = isFixed ? "APPROVED" : ageDays <= 3 ? "PENDING_APPROVAL" : wantsInvoice ? "APPROVED" : "REJECTED";

      const order = await db.order.create({
        data: { profileId, serviceId: service.id, customerName: customer.name, customerPhone: customer.phone, status, source, visitorId, createdAt },
      });
      if (status !== "APPROVED") continue;

      const amount = isFixed ? service.amountQepik! : 32_000;
      const issuedAt = new Date(createdAt.getTime() + (isFixed ? 0 : 3_600_000 * 5));
      const dueAt = new Date(issuedAt.getTime() + 3 * 86_400_000);
      const r = rnd();
      const invStatus = ageDays > 5 ? (r < 0.78 ? "PAID" : r < 0.9 ? "OVERDUE" : "CANCELLED") : r < 0.4 ? "PAID" : r < 0.6 ? "CLAIMED_PAID" : "SENT";
      const paidAt = invStatus === "PAID" ? new Date(Math.min(now.getTime(), issuedAt.getTime() + rnd() * 3 * 86_400_000)) : null;
      seq++;
      await db.invoice.create({
        data: {
          publicId: `demo${seq}${Math.floor(rnd() * 1e9).toString(36)}`,
          number: `${profile.invoicePrefix}-${issuedAt.getFullYear()}-${String(seq).padStart(4, "0")}`,
          profileId,
          orderId: order.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          status: invStatus,
          totalQepik: amount,
          currency: service.currency,
          issuedAt,
          dueAt,
          paidAt,
          createdAt: issuedAt,
          items: { create: [{ title: service.title, quantity: 1, unitQepik: amount }] },
        },
      });
    }
  }
  await db.profileEvent.createMany({ data: events });
  await db.profile.update({ where: { id: profileId }, data: { invoiceSeq: seq } });
}

// Kataloq boş görünməsin deyə nümunə satıcılar — YALNIZ lokal bazada (DATABASE_URL yoxdursa).
// Real bazada saxta elan olmamalıdır.
async function seedCatalogSellers() {
  if (process.env.DATABASE_URL) return;
  if (await db.user.count({ where: { email: { endsWith: "@demo.karvan.az" } } })) return;

  type S = { title: string; category: string; amount?: number; currency?: string; days?: number; weeks?: number; months?: number; description: string };
  const SELLERS: { username: string; name: string; profession: string; city: string; color: string; plan: "FREE" | "PRO" | "PRO_MAX"; services: S[] }[] = [
    { username: "leyla.makeup", name: "Leyla Həsənova", profession: "Makiyaj ustası", city: "Bakı", color: "#db2777", plan: "PRO_MAX", services: [
      { title: "Gəlin makiyajı", category: "beauty", description: "Sınaq makiyajı daxil, toy günü evə gəlirəm." },
      { title: "Gündəlik makiyaj", category: "beauty", amount: 40, description: "Yüngül, təbii görünüş, 45 dəqiqə." },
    ] },
    { username: "aygun.english", name: "Aygün Quliyeva", profession: "İngilis dili müəllimi", city: "Bakı", color: "#7c3aed", plan: "PRO", services: [
      { title: "IELTS hazırlıq kursu", category: "education", amount: 320, weeks: 8, description: "Həftədə 3 dərs, sınaq imtahanları ilə." },
      { title: "Fərdi danışıq dərsi", category: "education", amount: 25, description: "60 dəqiqə onlayn, istənilən səviyyə." },
    ] },
    { username: "studio.nur", name: "Studio Nur", profession: "Fotoqraf", city: "Gəncə", color: "#0284c7", plan: "PRO", services: [
      { title: "Portret fotosessiya", category: "photo_video", amount: 150, description: "1 saat çəkiliş, 20 işlənmiş şəkil." },
      { title: "Toy çəkilişi", category: "photo_video", description: "Foto və video, tam gün." },
    ] },
    { username: "rauf.fit", name: "Rauf Əliyev", profession: "Fitness məşqçisi", city: "Sumqayıt", color: "#059669", plan: "FREE", services: [
      { title: "Aylıq məşq proqramı", category: "fitness", amount: 90, months: 1, description: "Fərdi plan və həftəlik yoxlama." },
      { title: "Qidalanma planı", category: "fitness", amount: 35, description: "Hədəfinizə uyğun menyu." },
    ] },
    { username: "pixel.lab", name: "Pixel Lab", profession: "Dizayn studiyası", city: "Bakı", color: "#ea580c", plan: "PRO_MAX", services: [
      { title: "Loqo dizaynı", category: "design", amount: 250, days: 7, description: "3 konsepsiya, limitsiz düzəliş." },
      { title: "Brendbuk", category: "design", amount: 900, weeks: 3, description: "Loqo, rənglər, şriftlər, sosial şablonlar." },
    ] },
    { username: "nigar.smm", name: "Nigar Məmmədli", profession: "SMM mütəxəssisi", city: "Bakı", color: "#e11d48", plan: "PRO", services: [
      { title: "Instagram idarəetməsi", category: "marketing", amount: 400, months: 1, description: "12 post, 30 story, hədəfli reklam." },
      { title: "Reels paketi", category: "marketing", amount: 120, description: "5 reels: ssenari, çəkiliş, montaj." },
    ] },
    { username: "dr.sebine", name: "Dr. Səbinə Kərimova", profession: "Psixoloq", city: "Bakı", color: "#4f46e5", plan: "FREE", services: [
      { title: "Onlayn psixoloji seans", category: "psychology", amount: 60, description: "50 dəqiqə, məxfi." },
    ] },
    { username: "nail.art.baku", name: "Nail Art Bakı", profession: "Dırnaq ustası", city: "Bakı", color: "#c026d3", plan: "FREE", services: [
      { title: "Manikür + gel lak", category: "beauty", amount: 35, description: "Steril alətlər, 1 saat." },
      { title: "Dırnaq dizaynı", category: "beauty", amount: 15, description: "Hər dırnaq üçün fərdi dizayn." },
    ] },
    { username: "translate.pro", name: "Tural Nəsirov", profession: "Tərcüməçi", city: "Gəncə", color: "#0f766e", plan: "FREE", services: [
      { title: "Sənəd tərcüməsi (EN/RU/TR)", category: "translation", amount: 10, currency: "USD", description: "1 səhifə, 24 saata hazır." },
    ] },
  ];

  const password = await hashPassword(Math.random().toString(36) + Date.now());
  for (const [i, s] of SELLERS.entries()) {
    if (await db.profile.findUnique({ where: { username: s.username }, select: { id: true } })) continue;
    await db.user.create({
      data: {
        email: `${s.username}@demo.karvan.az`,
        passwordHash: password,
        subscription: { create: { plan: s.plan } },
        profile: {
          create: {
            username: s.username,
            displayName: s.name,
            profession: s.profession,
            city: s.city,
            theme: { primary: s.color },
            services: {
              create: s.services.map((x, position) => ({
                title: x.title,
                description: x.description,
                category: x.category,
                priceType: x.amount ? "FIXED" : "NEGOTIABLE",
                amountQepik: x.amount ? x.amount * 100 : null,
                currency: x.currency ?? "AZN",
                durationDays: x.days,
                durationWeeks: x.weeks,
                durationMonths: x.months,
                position,
                createdAt: new Date(Date.now() - (i * 2 + position) * 86_400_000),
              })),
            },
          },
        },
      },
    });
  }
}
