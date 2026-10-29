# BioFaktura

Instagram/TikTok-da xidmət satanlar üçün link-in-bio səhifə, sifariş formu, avtomatik PDF faktura və ödəniş izləmə. AI sərbəst mətndən faktura yaradır, xidmət təsvirləri, tema və ödəniş xatırlatmaları yazır.

Məhsul spesifikasiyası: [docs/PRD.md](docs/PRD.md)

## Stek

Next.js (App Router) · TypeScript · Tailwind CSS · PostgreSQL + Prisma · `@react-pdf/renderer` · Anthropic Claude API

## Başlamaq

```bash
cp .env.example .env   # DATABASE_URL və ANTHROPIC_API_KEY doldurun
npm install
npm run db:migrate
npx prisma db seed     # demo profil: /demo
npm run dev
```

## Struktur

| Yol | Nədir |
|---|---|
| `src/app/[username]` | İctimai link-in-bio səhifə və sifariş formu |
| `src/app/i/[publicId]` | Müştəri üçün faktura səhifəsi (rekvizitlər, "Ödədim", PDF) |
| `src/app/dashboard` | Satıcı paneli: gəlir, gözləyən məbləğ, fakturalar |
| `src/app/api/orders` | Sifariş: sabit qiymət → dərhal faktura, razılaşma → təsdiq gözləyir |
| `src/app/api/invoices/[publicId]/pdf` | PDF faktura |
| `src/app/api/ai/[task]` | `parse-invoice`, `describe-service`, `theme`, `reminder` |
| `src/lib/ai.ts` | Claude ilə strukturlu çıxış (Zod) |
| `src/lib/invoices.ts` | Faktura nömrələnməsi və plan limiti (pulsuz: ayda 5) |
| `src/lib/payments` | `PaymentProvider` interfeysi (manual, gateway M5-də) |
| `src/lib/notify` | WhatsApp paylaşma linki, e-poçt/SMS (M2/M5) |
| `prisma/schema.prisma` | Data modeli |

## Hələ edilməyənlər

Autentifikasiya (M1, indilik `DEV_PROFILE_USERNAME`), satıcı redaktə formaları, sifariş təsdiq UI-ı, e-poçt/SMS göndərmə, onlayn ödəniş gateway-i, AI limit sayğacı, avtomatik xatırlatma cron-u. Ətraflı: [PRD §12 Yol xəritəsi](docs/PRD.md#12-yol-xəritəsi).
