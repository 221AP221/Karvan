# BioFaktura

Instagram/TikTok-da xidmət satanlar üçün link-in-bio səhifə, sifariş formu, avtomatik PDF faktura və ödəniş izləmə. AI sərbəst mətndən faktura yaradır, xidmət təsvirləri, tema və ödəniş xatırlatmaları yazır.

Məhsul spesifikasiyası: [docs/PRD.md](docs/PRD.md)

## Nə işləyir

**Satıcı** (`/signup` → `/dashboard`)
- Qeydiyyat və giriş (e-poçt + şifrə, 30 günlük sessiya)
- Profil: ad, bio, avatar, rəng, faktura prefiksi, kart/IBAN rekvizitləri, sosial linklər
- Xidmətlər: sabit qiymət və ya "razılaşma ilə", gizlətmək, redaktə, silmək
- Sifarişlər: razılaşma sorğularını qiymət yazıb təsdiqləmək (faktura avtomatik yaranır) və ya imtina etmək
- Fakturalar: əl ilə yaratmaq, WhatsApp ilə göndərmək, linki kopyalamaq, PDF, "ödənildi" / ləğv
- Müştəri "Ödədim" basanda təsdiq: "Pul gəlib" və ya "Gəlməyib"
- Panel: bu ay ödənilən, gözləyən məbləğ, təsdiq gözləyən sorğular, aylıq limit (pulsuz: 5 faktura)

**Müştəri** (`/<username>`, `/i/<id>`)
- Mobil link-in-bio səhifə, satıcının rəngi ilə
- Sabit qiymətli xidmət → dərhal faktura səhifəsi; razılaşma ilə → sorğu
- Faktura səhifəsi: rekvizitlər (kopyala düyməsi ilə), "Ödədim", PDF (QR kodlu)

**AI** (`ANTHROPIC_API_KEY` təyin edildikdə)
- Yeni faktura: "Aygün, 3 dərs 50 manatdan, cüməyə qədər" → doldurulmuş forma + xəbərdarlıqlar
- Xidmət təsviri: 3 variant
- Profil rəngi təklifi
- Ödəniş xatırlatması (ton seçimi ilə) → WhatsApp-da göndər

## Başlamaq

```bash
cp .env.example .env   # DATABASE_URL, istəyə görə ANTHROPIC_API_KEY
npm install
npm run db:migrate
npx prisma db seed     # demo: /demo, giriş demo@biofaktura.az / demo12345
npm run dev
```

Tam axın testi (Playwright quraşdırılmış olmalıdır):

```bash
npm run build && npm start   # ayrı terminalda
npm run test:e2e             # ekran görüntüləri: e2e/output/shots
```

## Struktur

| Yol | Nədir |
|---|---|
| `src/app/(auth)` | Qeydiyyat, giriş, çıxış |
| `src/app/dashboard` | Satıcı paneli və bütün server action-lar (`actions.ts`) |
| `src/app/[username]` | İctimai link-in-bio səhifə və sifariş formu |
| `src/app/i/[publicId]` | Müştəri üçün faktura səhifəsi |
| `src/app/api/orders` | Sifariş: sabit qiymət → faktura, razılaşma → təsdiq gözləyir |
| `src/app/api/invoices/[publicId]` | PDF və "Ödədim" |
| `src/app/api/ai/[task]` | `parse-invoice`, `describe-service`, `theme`, `reminder` |
| `src/lib/ai.ts` | Claude ilə strukturlu çıxış (Zod) |
| `src/lib/auth.ts` | scrypt şifrə heşi, DB sessiyaları, `requireProfile()` |
| `src/lib/invoices.ts` | Faktura nömrələnməsi və plan limiti (kilidli tranzaksiya) |
| `src/lib/pdf` | PDF faktura (DejaVu şrifti — Azərbaycan hərfləri üçün) |
| `src/lib/payments`, `src/lib/notify` | Ödəniş provayderi interfeysi, WhatsApp linkləri |
| `prisma/schema.prisma` | Data modeli |

## Hələ edilməyənlər

SMS OTP / Google girişi, şifrə bərpası, e-poçt və SMS göndərmə, onlayn ödəniş gateway-i, Pro abunəliyin ödənişi, AI limit sayğacı, avtomatik xatırlatma cron-u, avatar yükləmə (indilik link), rate limit. Ətraflı: [PRD §12](docs/PRD.md#12-yol-xəritəsi).
