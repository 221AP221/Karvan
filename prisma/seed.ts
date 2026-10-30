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

const profile = await db.profile.upsert({
  where: { username: "demo" },
  update: {
    profession: "İngilis dili müəllimi",
    about:
      "8 ildir ingilis dili tədris edirəm. Cambridge CELTA sertifikatım var, 300-dən çox tələbəm IELTS imtahanından 6.5+ bal alıb.\n\nDərslər fərdi və onlayn keçirilir. Hər tələbə üçün səviyyəsinə uyğun plan hazırlayıram.",
  },
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

if ((await db.portfolioItem.count({ where: { profileId: profile.id } })) === 0) {
  await db.portfolioItem.createMany({
    data: [
      { profileId: profile.id, position: 0, title: "IELTS 7.5 — Nigar", description: "3 aylıq intensiv hazırlıq, Speaking 5.5-dən 7.5-ə." },
      { profileId: profile.id, position: 1, title: "Korporativ kurs — Kapital Bank", description: "12 əməkdaş üçün Business English qrupu." },
      { profileId: profile.id, position: 2, title: "Uşaqlar üçün yay məktəbi", description: "8-12 yaş, oyunlarla danışıq praktikası." },
    ],
  });
}

console.log("Demo profil: /demo · giriş: demo@karvan.az / demo12345");
