import { db } from "../src/lib/db";

const user = await db.user.upsert({
  where: { email: "demo@biofaktura.az" },
  update: {},
  create: { email: "demo@biofaktura.az", subscription: { create: { plan: "FREE" } } },
});

await db.profile.upsert({
  where: { username: "demo" },
  update: {},
  create: {
    userId: user.id,
    username: "demo",
    displayName: "Aygün Məmmədova",
    bio: "İngilis dili müəllimi · Fərdi və onlayn dərslər",
    invoicePrefix: "AYG",
    theme: { primary: "#6d28d9" },
    cardNumber: "4169 0000 0000 1234",
    bankName: "Kapital Bank",
    accountName: "Aygün Məmmədova",
    socialLinks: {
      create: [
        { platform: "INSTAGRAM", label: "Instagram", url: "https://instagram.com/demo", position: 0 },
        { platform: "WHATSAPP", label: "WhatsApp", url: "https://wa.me/994501234567", position: 1 },
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

console.log("Demo profil hazırdır: /demo");
