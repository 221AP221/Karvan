# PRD: AI Link-in-Bio və Dinamik Faktura Generatoru

> Məhsulun adı: **Karvan** · domen: karvan.az
> Versiya: 0.1 (MVP) · Bazar: Azərbaycan · Platforma: mobil-uyğun veb tətbiq (PWA)

---

## 1. Problem

Instagram və TikTok-da xidmət satan şəxslər (konsultantlar, təlimçilər, dizaynerlər, SMM/reklam mütəxəssisləri, makiyaj ustaları, repetitorlar) üç ayrı problemlə üzləşirlər:

1. **Profil linki dağınıqdır.** Linktree kimi servislər yalnız link siyahısı verir, xidməti "sifariş et" imkanı yoxdur.
2. **Ödəniş prosesi əl ilədir.** Hər müştəriyə DM-də kart nömrəsi və ya IBAN yazılır, məbləğ ayrıca razılaşdırılır, sonra "göndərdim?" yazışması başlayır.
3. **Həvəskar görüntü.** Faktura və ya çek yoxdur, ödəniş izlənmir, kim ödəyib, kim ödəməyib qarışır.

## 2. Həll

Satıcı öz micro-page-ni yaradır: `karvan.az/<istifadəçi_adı>`. Səhifədə:

- profil (avatar, bio), sosial linklər;
- xidmətlər siyahısı və hər birinin yanında **"Sifariş et"** düyməsi;
- sifariş formu, sonda avtomatik **PDF faktura**;
- fakturada ödəniş üsulu: **rekvizit (kart/IBAN)** və ya **onlayn ödəniş**;
- satıcı panelində ödəniş statusunun izlənməsi və xatırlatmalar.

AI dörd yerdə işləyir: sərbəst mətndən faktura, xidmət təsvirləri, dizayn/tema təklifi, ödəniş xatırlatmaları.

## 3. Hədəf istifadəçilər

| Persona | Nümunə | Əsas ehtiyac |
|---|---|---|
| **Satıcı (əsas müştərimiz)** | Fiziki şəxs kimi xidmət satan bloqer/mütəxəssis | Peşəkar görünmək, ödənişi tez almaq, kim ödəyib bilmək |
| **Son müştəri** | Instagram izləyicisi | Tez sifariş, aydın məbləğ, rahat ödəniş |

MVP üçün faktura **qeyri-rəsmi ödəniş sorğusu** sayılır. VOEN və e-qaimə tələb olunmur (bax: §10 Hüquqi qeydlər).

## 4. Məqsədlər və uğur metrikləri

| Metrik | MVP hədəfi (lansdan 3 ay sonra) |
|---|---|
| Qeydiyyatdan keçən satıcı | 500 |
| Ən azı 1 faktura göndərən satıcı (aktivləşmə) | ≥ 40% |
| Fakturanın ödənilmə nisbəti | ≥ 70% |
| Fakturanın yaradılmasından ödənişə qədər orta vaxt | < 24 saat |
| Pulsuzdan Pro plana keçid | ≥ 5% |

**MVP-yə daxil deyil:** e-taxes inteqrasiyası, native mobil tətbiq, çoxdilli interfeys, komanda hesabları, təqvim/rezervasiya.

## 5. Funksional tələblər

### 5.1 Link-in-bio səhifə
- F1. Satıcı unikal `username` seçir (`a-z`, `0-9`, `_`, `.`; 3–30 simvol, qadağan olunmuş sözlər siyahısı).
- F2. Profil: ad, avatar, bio, şəhər, sosial linklər (Instagram, TikTok, WhatsApp, Telegram, YouTube, sərbəst link).
- F3. Xidmətlər: ad, təsvir, qiymət növü (**sabit** və ya **razılaşma ilə**), məbləğ (AZN), müddət/həcm, aktiv/deaktiv.
- F4. Tema: rəng palitrası, şrift, düymə forması. Pulsuz planda altda "Karvan ilə yaradılıb" yazısı görünür.
- F5. Səhifə ilk açılışda 2 saniyədən tez yüklənməlidir (mobil 4G); SEO və OG şəkli olmalıdır.

### 5.2 Sifariş axını (xidmətdən asılı)

```
Müştəri xidməti seçir
        │
        ├── Sabit qiymət ──────► Forma ─► Faktura dərhal yaranır ─► Ödəniş səhifəsi
        │
        └── Razılaşma ilə ─────► Forma (sorğu) ─► Satıcıya bildiriş
                                                   │
                                     Satıcı qiyməti təsdiqləyir / dəyişir / imtina edir
                                                   │
                                     Faktura yaranır ─► Müştəriyə göndərilir
```

- F6. Sifariş formu: ad, telefon (məcburi, `+994` formatı), e-poçt (könüllü), qeyd, istəyə görə miqdar.
- F7. Sifariş statusları: `PENDING_APPROVAL` → `APPROVED` / `REJECTED` → (fakturaya keçir).
- F8. Satıcı paneldən müştərisiz də faktura yarada bilir (DM-də razılaşdırılmış iş üçün).

### 5.3 PDF faktura
- F9. Avtomatik nömrə: `<prefiks>-<il>-<sıra>` (məs. `AYG-2026-0042`), hər satıcı üçün ayrı sıra.
- F10. Məzmun: satıcı adı/loqosu, müştəri, sətirlər (xidmət, miqdar, qiymət), cəm, ödəniş müddəti, ödəniş üsulları, QR kod (fakturanın onlayn linki).
- F11. Faktura üçün ictimai səhifə: `/i/<public_id>` (təxmin edilə bilməyən ID). Oradan PDF yüklənir və ödəniş edilir.
- F12. Tema rəngləri PDF-ə tətbiq olunur. Pulsuz planda PDF-də platforma loqosu var.

### 5.4 Ödəniş və status izləmə
- F13. Satıcı hər faktura üçün üsul seçir: **manual (rekvizit)**, **onlayn**, ya da **hər ikisi**.
- F14. Manual: fakturada kart nömrəsi / IBAN / bank adı göstərilir. Müştəri "Ödədim" düyməsini basa bilər (istəyə görə qəbz şəkli yükləyir), satıcı təsdiqləyir.
- F15. Onlayn: payment gateway (bax: §8). Webhook gələndə status avtomatik `PAID` olur.
- F16. Faktura statusları: `DRAFT`, `SENT`, `VIEWED`, `CLAIMED_PAID` (müştəri "ödədim" dedi), `PAID`, `OVERDUE`, `CANCELLED`.
- F17. Panel: statuslar üzrə filtr, aylıq gəlir, gözləyən məbləğ, gecikən fakturalar.

### 5.5 Bildirişlər (WhatsApp, e-poçt, SMS)
- F18. Faktura göndərmə kanalları:
  - **WhatsApp**: MVP-də `wa.me` paylaşma linki (satıcı öz nömrəsindən göndərir); Pro planda WhatsApp Business API ilə avtomatik.
  - **E-poçt**: PDF əlavə ilə.
  - **SMS**: faktura linki ilə qısa mesaj (yerli SMS provayder).
- F19. Avtomatik xatırlatma: son ödəniş günündən 1 gün əvvəl, həmin gün və 3 gün sonra (satıcı söndürə bilər).

### 5.6 AI funksiyaları

| # | Funksiya | Giriş | Çıxış | Qeyd |
|---|---|---|---|---|
| AI-1 | **Sərbəst mətndən faktura** | "Aygün Məmmədova, 3 fərdi dərs, hər biri 50 manat, cümə gününə qədər" | Strukturlu JSON: müştəri, sətirlər, son tarix | Satıcı nəticəni yoxlayıb təsdiqləyir, AI heç vaxt fakturanı özü göndərmir |
| AI-2 | **Xidmət təsviri** | Xidmət adı + bir neçə açar söz | 2–3 cümləlik satış mətni (AZ) | 3 variant təklif edir |
| AI-3 | **Tema təklifi** | Bio, sahə, (istəyə görə) loqo | Rəng palitrası + şrift + üslub | Kontrast yoxlanır |
| AI-4 | **Ödəniş xatırlatması** | Faktura məlumatı, gecikmə günü, ton | Nəzakətli WhatsApp/SMS mətni | SMS üçün 160 simvol limiti |

Model: Claude (Anthropic API). AI çıxışı həmişə satıcının təsdiqindən keçir.

## 6. Planlar (Freemium + abunəlik)

| | **Pulsuz** | **Pro** (təklif: 14,90 AZN/ay, illik 119 AZN) |
|---|---|---|
| Link-in-bio səhifə | ✅ | ✅ |
| Faktura | **ayda 5** | limitsiz |
| Platforma loqosu (səhifə + PDF) | var | yoxdur, öz loqonuz |
| Temalar | 3 əsas | hamısı + AI tema |
| AI funksiyaları | ayda 10 sorğu | genişləndirilmiş limit |
| Onlayn ödəniş | ❌ (yalnız rekvizit) | ✅ |
| Kanallar | WhatsApp linki, e-poçt | + SMS, avtomatik WhatsApp, avtomatik xatırlatmalar |
| Statistika | əsas | ətraflı + export (CSV) |

> Limit təqvim ayı üzrə sayılır. `CANCELLED` fakturalar da limitə daxildir (sui-istifadənin qarşısını almaq üçün).

## 7. Qeyri-funksional tələblər

- **Dil:** interfeys yalnız Azərbaycan dilində (i18n strukturu sonrakı dillər üçün hazır saxlanılır).
- **Valyuta:** AZN; məbləğlər qəpiklə tam ədəd kimi saxlanılır (`amount_qepik`).
- **Təhlükəsizlik:** ictimai faktura ID-ləri təxmin edilə bilməz; rate limit (sifariş formu və AI endpoint-ləri); webhook imza yoxlaması; kart məlumatları **heç vaxt** bizim serverdə saxlanılmır.
- **Məxfilik:** müştəri telefonları yalnız həmin satıcıya görünür; hesab silinəndə məlumatlar silinir.
- **Performans:** ictimai səhifə ISR/cache ilə; PDF generasiya < 3 saniyə.

## 8. Ödəniş inteqrasiyası

Abstraksiya: `PaymentProvider` interfeysi (`createPayment`, `verifyWebhook`, `getStatus`). MVP-də:

1. `manual`: rekvizit göstərilməsi + təsdiq axını (dərhal hazırdır).
2. `gateway`: yerli provayderlərdən biri (namizədlər: Payriff, Epoint, GoldenPay, Kapital Bank / PASHA Bank e-commerce). **Seçim kommersiya şərtlərinə görə edilməlidir** (komissiya, fiziki şəxslə müqavilə imkanı, payout müddəti).

> Diqqət: fiziki şəxs satıcılar üçün pulu platforma toplayıb sonra ötürərsə (marketplace modeli) bu, lisenziya/hüquqi tələblər yarada bilər. Alternativ: hər satıcı provayderdə öz merchant hesabını açır, biz yalnız inteqrasiya edirik. MVP üçün tövsiyə edilən **ikinci yanaşmadır**.

## 9. Data modeli (xülasə)

```
User ─1:1─ Profile ─1:N─ SocialLink
              │
              ├─1:N─ Service
              ├─1:N─ Order ──0:1── Invoice ─1:N─ InvoiceItem
              │                       ├─1:N─ Payment
              │                       └─1:N─ Reminder
              └─1:1─ Subscription (plan, period)
```

Tam sxem: [`prisma/schema.prisma`](../prisma/schema.prisma).

## 10. Hüquqi qeydlər

- MVP-də sənəd "Faktura / Ödəniş sorğusu" adlanır, üzərində "Rəsmi vergi sənədi deyil" qeydi var.
- Gələcəkdə VOEN-li fərdi sahibkarlar üçün VOEN sahəsi və e-taxes e-qaimə inteqrasiyası (v2).
- İstifadə şərtləri və məxfilik siyasəti lansdan əvvəl hüquqşünasla yoxlanılmalıdır.

## 11. Texniki stek

| Qat | Seçim |
|---|---|
| Frontend + backend | Next.js (App Router), TypeScript, Tailwind CSS |
| Verilənlər bazası | PostgreSQL + Prisma |
| Autentifikasiya | Telefon (SMS OTP) və ya Google ilə giriş (Auth.js) |
| PDF | `@react-pdf/renderer` (server-side) |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`), strukturlu çıxış (Zod) |
| Fayllar (avatar, qəbz) | S3-uyğun saxlama (Cloudflare R2) |
| Bildirişlər | E-poçt: Resend; SMS: yerli provayder; WhatsApp: `wa.me` → Business API |
| Fon işləri (xatırlatmalar) | Cron (Vercel Cron) + DB növbəsi |
| Hostinq | Vercel + idarə olunan Postgres (Neon/Supabase) |

## 12. Yol xəritəsi

| Mərhələ | Müddət | Çıxış |
|---|---|---|
| **M0. Skelet** | 1 həftə | Layihə strukturu, DB sxemi, dizayn sistemi |
| **M1. Link-in-bio** | 2 həftə | Qeydiyyat, profil, xidmətlər, ictimai səhifə, temalar |
| **M2. Sifariş + faktura** | 2 həftə | Sifariş formu, təsdiq axını, PDF, faktura səhifəsi, WhatsApp/e-poçt göndərmə |
| **M3. Ödəniş + izləmə** | 2 həftə | Manual təsdiq, panel, statuslar, plan limitləri |
| **M4. AI** | 1 həftə | AI-1…AI-4 |
| **M5. Pro + onlayn ödəniş** | 2 həftə | Abunəlik ödənişi, gateway, SMS, avtomatik xatırlatmalar |
| **Beta** | 2 həftə | 20–30 real satıcı ilə test |

## 13. Ad variantları

| Ad | İdeya |
|---|---|
| **Karvan** ✅ seçildi | Qısa, yerli, yaddaqalan: xidmətlər karvanı kimi satıcıdan müştəriyə |
| BioFaktura | İlkin işçi ad |
| **Qaimə.link** | Yerli söz + link konsepti |
| **Sifarişim** | Müştəri baxımından sadə |
| **Hesabla** | "Hesab yaz" ifadəsindən, feil kimi yaddaqalan |
| **Ödə.me** | Qısa, paylaşmaq üçün rahat link (`ode.me/aygun`) |

Domen yoxlanışı (`.az`, `.link`, `.me`) seçimdən əvvəl edilməlidir.

## 14. Açıq suallar

1. Hansı payment gateway (komissiya, fiziki şəxs üçün müqavilə şərtləri)?
2. Pro abunəliyin özü necə ödəniləcək (kart, avtomatik yenilənmə)?
3. Giriş üsulu: SMS OTP (xərc) və ya Google/Instagram ilə giriş?
4. Qəbz şəklinin AI ilə yoxlanılması (məbləğ və tarix uyğunluğu) v1.1-ə əlavə edilsinmi?
