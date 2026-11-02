# Karvan

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
- Panel: bu ay ödənilən, gözləyən məbləğ, təsdiq gözləyən sorğular, aylıq limit
- Analitika (`/dashboard/analytics`): satış və auditoriya KPI-ları, mənbələr, qıf; Pro Max-da Excel (CSV) hesabat
- Planlar: Pulsuz (5 faktura/ay, 5 xidmət), Pro 9,99 AZN (100 faktura, 30 xidmət, təsdiqlənmiş nişanı),
  Pro Max 29,99 AZN (limitsiz, kataloqda önə çıxma, hesabat). Ödəniş qəbulu hələ qoşulmayıb.

**Admin** (`/admin`)
- İcmal: istifadəçilər, yeni qeydiyyatlar, planlar, təxmini MRR, platforma dövriyyəsi, sifariş/faktura/baxış sayları
- İstifadəçilər: axtarış və filtr, plan dəyişmək, bloklamaq (səbəb ilə; hesab dərhal çıxış edir, səhifə gizlənir),
  bütün cihazlardan çıxartmaq, silmək (e-poçtla təsdiq). FİN/pasport maskalanmış göstərilir
- Sürətli əməliyyatlar: hər sətirdə tarifi qaldır/sal, blokla/bloku götür, dəyiş; bir neçə hesabı seçib toplu
  tarif, bloklama, bloku götürmə, çıxış etdirmə. İstifadəçi səhifəsində əməliyyat kartları və məlumat düzəlişi
- Jurnal: istifadəçi fəaliyyəti (giriş, uğursuz giriş, xidmət, sifariş, faktura, parametrlər; IP ilə) və admin
  əməliyyatları, filtrlər; istifadəçilər və jurnallar Excel-ə (CSV) ixrac olunur
- Xidmətlər: moderasiya (bloklanan xidmət səhifədə və kataloqda görünmür), fakturalar
- Lokal: `admin@karvan.az` / `admin12345` (super admin, seed yaradır). Yeni admin: Windows-da `create-admin.bat`
  faylını iki dəfə klikləyin, və ya `npm run admin -- e-poçt şifrə [--super]`
- Super admin: adminləri təyin edir, istifadəçi kimi daxil olur (dəstək üçün). Şifrələr görünmür (hash), admin yenisini
  və ya müvəqqəti şifrə təyin edir

**Abunəlik ödənişi:** kart məlumatı Karvan-a daxil olmur. İstifadəçi gateway-in öz səhifəsinə yönləndirilir, nəticə
`/api/payments/webhook/<provider>` ilə imzalı bildirişlə gəlir (məbləğ və imza yoxlanılır, təkrar bildiriş zərərsizdir).
Test rejimində `/pay/sandbox` səhifəsi real gateway kimi işləyir (test kartları, imzalı webhook); canlıya çıxanda yalnız `.env` açarları dəyişir. Aqreqator `.env`-də seçilir: `PAYMENT_GATEWAY=epoint` və ya `payriff` (+ açarlar). Webhook gəlməsə də, istifadəçi qayıdanda nəticə gateway API-dən yoxlanılır.
Bank köçürməsi: admin "Ödənişlər"-də təsdiqləyir.

**Sayt** (`/`, `/tr`, `/ru`)
- Ana səhifə və kataloq Azərbaycan, türk, rus və ingilis dillərində (hər dilin öz URL-i, hreflang, sitemap.xml)
- İşıqlı və qaranlıq rejim (seçim yadda qalır, ilk dəfə sistem ayarı)
- Xidmətlər kataloqu (`/xidmetler`, `/tr/hizmetler`, `/ru/uslugi`): axtarış, sahə, şəhər, qiymət, valyuta, təsdiqlənmiş, sıralama.
  Satıcı Parametrlərdən kataloqda görünməməyi seçə bilər. Lokal bazada nümunə satıcılar əlavə olunur.

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

Lazım olan yeganə şey [Node.js](https://nodejs.org) (LTS). Heç bir xidmətdə qeydiyyat tələb olunmur: verilənlər bazası kompüterinizdə işləyir (`prisma dev`).

```bash
npm install
npm run setup   # lokal baza + cədvəllər + demo məlumat
npm run dev     # http://localhost:3000/login
```

Demo giriş: `demo@karvan.az` / `demo12345` · demo səhifə: http://localhost:3000/demo

Öz PostgreSQL bazanızı istifadə etmək üçün `.env` faylında `DATABASE_URL` yazın (bax: `.env.example`). AI funksiyaları üçün `ANTHROPIC_API_KEY` lazımdır; onsuz da tətbiq işləyir, sadəcə AI düymələri xəbərdarlıq göstərir.

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
