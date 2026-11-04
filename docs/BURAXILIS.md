# Buraxılış təlimatı (go-live)

Bu sənəd Karvanı produksiyaya çıxarmaq üçün addımları və lansdan sonrakı gündəlik əməliyyatı təsvir edir.
BRD-dəki keçid tələbləri (§19) və buraxılış şərtləri (§26) ilə uyğundur.

---

## 1. Hazırlıq siyahısı

| # | Addım | BRD | Kim |
|---|---|---|---|
| 1 | Domen və hostinq hazırdır, `NEXT_PUBLIC_APP_URL` real domenə yönləndirilib | G-01, TR-01 | Texniki |
| 2 | `APP_SECRET` təyin edilib (uzun təsadüfi dəyər) | G-02, TR-02 | Texniki |
| 3 | `DATABASE_URL` produksiya bazasına baxır, miqrasiyalar tətbiq olunub | TR-03 | Texniki |
| 4 | Ödəniş aqreqatoru seçilib, açarlar yazılıb, webhook ünvanı kabinetdə göstərilib | G-03 | Biznes + Texniki |
| 5 | Bank rekvizitləri (`BILLING_IBAN`, `BILLING_VOEN`, `BILLING_BANK`) yazılıb | G-04 | Biznes |
| 6 | AI açarı admin paneldə yazılıb və "AI-ı yoxla" uğurlu cavab verib | G-05 | Super admin |
| 7 | E-poçt provayderi (`RESEND_API_KEY`) qoşulub, domen təsdiqlənib | G-06 | Texniki |
| 8 | Hüquqi səhifələr hüquqşünas rəyindən keçib, "layihə variantı" xəbərdarlığı silinib | G-07 | Hüquq |
| 9 | Ən azı 2 super admin hesabı var, demo hesablar silinib | G-08, TR-14 | Super admin |
| 10 | Gündəlik ehtiyat nüsxə işləyir, bərpa bir dəfə sınaqdan keçirilib | G-09, TR-04 | Texniki |
| 11 | `/api/health` xarici monitorinqə qoşulub, xəbərdarlıq kanalı işləyir | G-10, TR-06 | Texniki |
| 12 | UAT ssenariləri (§25) keçib, açıq kritik defekt yoxdur | G-12 | BA |
| 13 | Sayt Search Console-a əlavə olunub, `sitemap.xml` göndərilib | G-13, TR-13 | Marketinq |
| 14 | Dəstək prosedurları oxunub, komanda təlim keçib (`docs/DESTEK.md`) | G-14, TR-08/10 | Dəstək |

**Qərar qaydası:** 1-12 bağlanmayınca lans olmur. 13 və 14 lansdan sonrakı ilk həftədə bağlana bilər.

---

## 2. Mühit dəyişənləri

| Dəyişən | Məcburi | Təsviri |
|---|---|---|
| `DATABASE_URL` | bəli | PostgreSQL bağlantısı. Verilməyibsə lokal inkişaf bazası işlədilir. |
| `NEXT_PUBLIC_APP_URL` | bəli | `https://karvan.az` — faktura linkləri, sitemap və webhook ünvanı bundan qurulur. |
| `APP_SECRET` | bəli | AI açarlarının şifrələnməsi üçün (AES-256-GCM). Uzun təsadüfi dəyər. |
| `PAYMENT_GATEWAY` | bəli | `epoint`, `payriff` və ya `sandbox` (test). |
| `EPOINT_PUBLIC_KEY` / `EPOINT_PRIVATE_KEY` | aqreqatora görə | Epoint seçiləndə. |
| `PAYRIFF_MERCHANT` / `PAYRIFF_SECRET` | aqreqatora görə | Payriff seçiləndə. |
| `BILLING_IBAN`, `BILLING_VOEN`, `BILLING_BANK`, `BILLING_RECIPIENT` | bəli | Bank köçürməsi rekvizitləri. |
| `RESEND_API_KEY` | bəli | Şifrə bərpası və passivlik xəbərdarlıqları. Yoxdursa bərpa işləmir. |
| `CRON_SECRET` | bəli | Təmizlənmə nöqtəsinin açarı (`/api/cron/cleanup`). Yoxdursa nöqtə bağlıdır. |
| Admin paneldəki AI ayarı (və ya `GROQ_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `XAI_API_KEY`, `ANTHROPIC_API_KEY`) | xeyr | AI köməkçi və chatbot. Yoxdursa AI funksiyaları gizlənir, chatbot əlaqə kanallarını göstərir. |

> Sirlər repozitoriyada saxlanılmır: hostinq provayderinin "environment variables" bölməsində verilir.

---

## 3. İlk quraşdırma

```bash
npm ci
npx prisma migrate deploy      # miqrasiyalar
npm run build
npm run start
```

Super admin hesabının yaradılması:

```bash
npm run admin -- epoct@karvan.az ŞifrəniBuraYaz --super
```

Yoxlama:

```bash
curl -s https://karvan.az/api/health      # {"ok":true,"db":"up",...}
curl -s -o /dev/null -w "%{http_code}\n" https://karvan.az/sitemap.xml
```

---

## 4. Ehtiyat nüsxə (TR-04)

```bash
npm run db:backup                    # backups/ qovluğuna, son 14 nüsxə saxlanılır
npm run db:backup -- --dir=/mnt/backup --keep=30
```

Gündəlik avtomatik işləməsi üçün cron nümunəsi (hər gün 03:20):

```
20 3 * * * cd /app && DATABASE_URL="..." npm run db:backup >> /var/log/karvan-backup.log 2>&1
```

Bərpa:

```bash
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" backups/karvan-<tarix>.dump
```

> **Vacib:** bərpa lansdan əvvəl ən azı bir dəfə test mühitində sınanmalıdır — işləməyən nüsxə nüsxə sayılmır.

---

## 4.1 Passiv hesabların təmizlənməsi

İstifadəçi parametrlərdən seçir (defolt 90 gün). Gündəlik cron nöqtəni çağırır: müddətə 14 gün qalanda
xəbərdarlıq məktubu gedir, müddət dolanda hesab silinir.

```
40 3 * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://karvan.az/api/cron/cleanup >> /var/log/karvan-cleanup.log 2>&1
```

Nəyin silinəcəyini əvvəlcədən görmək üçün (heç nə silinmir):

```bash
curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" "https://karvan.az/api/cron/cleanup?dryRun=1"
```

---

## 5. Monitorinq (TR-06)

`/api/health` bazanı yoxlayır: işləyəndə `200`, baza cavab vermədikdə `503` qaytarır.

1. Monitorinq xidmətində (UptimeRobot, BetterStack və ya analoq) yeni "HTTP monitor" yaradın.
2. Ünvan: `https://karvan.az/api/health`, interval: 1-5 dəqiqə.
3. Xəbərdarlıq kanalı: e-poçt + telefon bildirişi.
4. İkinci monitor: `https://karvan.az/` (ana səhifə) — tətbiqin ümumi vəziyyəti üçün.

---

## 6. Lansdan sonra ilk həftə

| Nə vaxt | Nə yoxlanılır |
|---|---|
| İlk 24 saat | Xəta jurnalları, `/api/health`, ilk qeydiyyatlar, ilk faktura və PDF |
| 2-3-cü gün | Real ödəniş (kiçik məbləğ) və webhook-un gəlməsi, abunəliyin aktivləşməsi |
| 1-ci həftə | Search Console-da indeksləşmə, sitemap xətaları, kataloq səhifələri |
| 30-cu gün | BRD §27 üzrə metrik icmalı: qeydiyyat, aktivləşmə, ödənilmə nisbəti |

---

## 7. Geri qayıtma (rollback)

| Hal | Addım |
|---|---|
| Yeni buraxılış xəta verir | Əvvəlki buraxılışa qayıdın; miqrasiya geri alınmırsa, düzəlişi irəli buraxılışla verin. |
| Ödəniş axını işləmir | `PAYMENT_GATEWAY` müvəqqəti `sandbox`-a keçirilmir — kart ödənişini söndürüb yalnız bank köçürməsini saxlayın və istifadəçilərə bildirin. |
| Baza zədələnib | Tətbiqi dayandırın, son nüsxədən bərpa edin, itən dövrü müəyyən edin. |
| Kütləvi spam | Qeydiyyatı müvəqqəti məhdudlaşdırın, `src/lib/rate-limit.ts` limitlərini sıxın, moderasiyanı gücləndirin. |
