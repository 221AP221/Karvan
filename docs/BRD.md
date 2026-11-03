# BRD — Karvan

**Biznes Tələbləri Sənədi (Business Requirements Document)**

| | |
|---|---|
| **Məhsul** | Karvan — sosial şəbəkədə xidmət satanlar üçün link-in-bio, sifariş, faktura və ödəniş izləmə platforması |
| **Domen** | karvan.az |
| **Versiya** | 1.0 · reallaşdırılmış məhsulun vəziyyəti |
| **Status** | Beta-ya hazır (buraxılış şərtləri: §18) |
| **Bazar** | Azərbaycan (əsas), Türkiyə / Gürcüstan / Qazaxıstan (hazırlıq) |
| **Platforma** | Mobil-uyğun veb tətbiq |
| **Əlaqəli sənədlər** | [PRD.md](./PRD.md) (ilkin məhsul konsepti), [`prisma/schema.prisma`](../prisma/schema.prisma) (tam data modeli), [README.md](../README.md) (quraşdırma) |

> **Bu sənəd nə üçündür.** PRD məhsulun *nə olacağını* təsvir edirdi. Bu BRD *nə qurulduğunu*, hansı biznes qaydaları ilə işlədiyini və canlıya çıxmaq üçün nə lazım olduğunu sənədləşdirir. Hər tələbin yanında reallaşma vəziyyəti göstərilib: ✅ hazır · 🟡 qismən · ⬜ planlaşdırılan.

---

## 1. İcra xülasəsi

Karvan Instagram, TikTok və WhatsApp-da xidmət satan fiziki şəxslərin satış prosesini bir yerə toplayır: bio linkindən açılan səhifə, sifariş forması, avtomatik PDF faktura, ödənişin izlənməsi və analitika. Satıcı 3 dəqiqəyə `karvan.az/adi` səhifəsini qurur, linki bio-ya qoyur və müştəridən DM-də qiymət danışığı aparmadan sifariş qəbul edir.

Məhsul iki tərəfli dəyər yaradır:

- **Satıcı üçün:** peşəkar görünüş, qiymətin açıq göstərilməsi, nömrələnmiş faktura, ödənişin kim tərəfindən və nə vaxt edildiyinin qeydi, gəlir analitikası.
- **Müştəri üçün:** qiyməti əvvəlcədən görmək, bir kliklə sifariş, QR kodlu faktura və aydın ödəniş rekvizitləri.

Gəlir modeli: **freemium abunəlik** (Pulsuz / Pro 9,99 AZN / Pro Max 29,99 AZN). Satışdan komissiya alınmır — müştəri pulu birbaşa satıcının kartına köçürür. Bu, platformanın ödəniş vasitəçisi kimi lisenziya tələbindən kənarda qalmasını təmin edir (§15).

Əlavə olaraq platforma **xidmətlər kataloqu** kimi işləyir: satıcıların xidmətləri ümumi axtarışda göstərilir, bu da bio linki olmayan müştəri axınını yaradır və SEO üzrə əsas böyümə kanalıdır (§9.4, §9.13).

---

## 2. Biznes konteksti

### 2.1 Problem

Sosial şəbəkədə xidmət satan şəxs üç əməliyyat problemi ilə üzləşir:

| # | Problem | Nəticə |
|---|---|---|
| P1 | Qiymət profildə görünmür, hər müştəri DM-də soruşur | Eyni cavabın təkrarı, itirilmiş vaxt, cavabsız qalan sorğular |
| P2 | Rekvizit əl ilə yazılır, ödəniş ekran şəkli ilə təsdiqlənir | Səhv köçürmə, "göndərdim / gəlməyib" mübahisəsi, həvəskar görüntü |
| P3 | Kim ödəyib, kim gecikir — dəftərdə və ya yaddaşda | İtirilmiş gəlir, hesabat yoxluğu, böyüməni planlaşdıra bilməmək |

### 2.2 İmkan

- Linktree tipli servislər yalnız link siyahısı verir: sifariş və faktura imkanı yoxdur.
- Mühasibat proqramları (faktura yaratmaq üçün) fiziki şəxs üçün ağır və bahalıdır, sosial şəbəkə ilə əlaqəsi yoxdur.
- Azərbaycan bazarında bu iki ehtiyacı birləşdirən, yerli dildə və yerli bank rekvizitləri ilə işləyən hazır məhsul yoxdur.

### 2.3 Rəqabət mövqeyi

| Alternativ | Niyə kifayət etmir |
|---|---|
| Linktree / Taplink | Sifariş və faktura yoxdur, ödəniş izlənmir |
| Excel + WhatsApp | Əl əməyi, nömrələnmiş sənəd yoxdur, analitika yoxdur |
| Mühasibat proqramları | VÖEN-li şirkətlər üçündür, qiymət və mürəkkəblik uyğun deyil |
| Instagram Shop | Fiziki məhsul üçündür, xidmət və razılaşma ilə qiymət dəstəklənmir |

---

## 3. Biznes məqsədləri və uğur metrikləri

| # | Məqsəd | Metrik | Hədəf (lansdan 3 ay) | Ölçmə yeri |
|---|---|---|---|---|
| M1 | Satıcı cəlb etmək | Qeydiyyatdan keçən satıcı | 500 | Admin → İcmal |
| M2 | Aktivləşmə | Ən azı 1 faktura göndərən satıcı | ≥ 40% | Admin → İcmal |
| M3 | Dəyər çatdırmaq | Fakturanın ödənilmə nisbəti | ≥ 70% | Satıcı → Analitika |
| M4 | Sürət | Fakturadan ödənişə qədər orta vaxt | < 24 saat | Satıcı → Analitika |
| M5 | Monetizasiya | Pulsuzdan ödənişli plana keçid | ≥ 5% | Admin → Ödənişlər |
| M6 | Orqanik böyümə | Kataloqdan gələn sifariş payı | ≥ 15% | Satıcı → Analitika (mənbələr) |
| M7 | Saxlanma | 2-ci ay abunəliyi uzadan | ≥ 80% | Admin → Ödənişlər |

Bütün metriklər məhsulun içində ölçülür: ayrıca analitika sistemi tələb olunmur (§9.8, §14).

---

## 4. Əhatə dairəsi

### 4.1 Daxildir ✅

Satıcı hesabı və səhifəsi · xidmətlər · sifariş axını · PDF faktura · manual ödəniş izləmə · satıcı analitikası · AI köməkçi · xidmətlər kataloqu · abunəlik və onun ödənişi · admin panel və moderasiya · 4 dil · qaranlıq rejim · SEO.

### 4.2 Daxil deyil (bu versiyada)

| Mövzu | Səbəb / plan |
|---|---|
| Müştəri fakturasının onlayn kartla ödənişi | Aqreqator inteqrasiyası abunəlik üçün qurulub; müştəri ödənişi növbəti mərhələdədir (§9.7) |
| Avtomatik bildirişlər (e-poçt, SMS, WhatsApp API) | Provayder müqaviləsi tələb olunur (§13.3) |
| Komanda üzvləri (Pro Max-da elan olunub) | ⬜ planlaşdırılan, interfeysdə "tezliklə" kimi göstərilir |
| VÖEN və e-qaimə inteqrasiyası | Hüquqi tələb yaranmır (§15), v2 |
| Rəy və reytinq sistemi | Kataloqun növbəti mərhələsi |
| Native mobil tətbiq | Veb tətbiq mobil-uyğundur, ehtiyac görünmür |
| Təqvim / rezervasiya | Ayrıca məhsul sahəsidir |

---

## 5. Paydaşlar və rollar

### 5.1 Sistem rolları

| Rol | Kim | İmkanlar |
|---|---|---|
| **Ziyarətçi** | Qeydiyyatsız şəxs | Ana səhifə, kataloq, satıcı səhifəsi, sifariş vermək, faktura səhifəsi |
| **Satıcı** (`USER`) | Xidmət satan fiziki şəxs | Öz səhifəsi, xidmətlər, sifarişlər, fakturalar, analitika, abunəlik, parametrlər |
| **Admin** (`ADMIN`) | Dəstək komandası | İstifadəçilər, moderasiya, ödənişlər, jurnallar, plan dəyişmək, şifrə təyin etmək |
| **Super admin** (`SUPER_ADMIN`) | Məhsul sahibi | Admin imkanları + rol təyinatı, istifadəçi kimi daxil olmaq, AI ayarı |

### 5.2 Məsuliyyət bölgüsü

| Sahə | Məsul | Qeyd |
|---|---|---|
| Satıcının məzmunu (xidmət, qiymət, şəkil) | Satıcı | Platforma yoxlamır, yalnız moderasiya edir |
| Müştəri ilə ödəniş münasibəti | Satıcı | Pul birbaşa satıcıya gedir (§15.1) |
| Moderasiya (qaydalara zidd məzmun) | Admin | §9.11 |
| Abunəlik ödənişlərinin təsdiqi | Admin / avtomatik | Kart avtomatik, köçürmə əl ilə (§9.10) |
| Platformanın işləkliyi, açarlar, baza | Super admin | §13 |

---

## 6. Personalar

| Persona | Profil | Əsas ehtiyac | Uğur meyarı |
|---|---|---|---|
| **Leyla, makiyaj ustası** | Bakı, 2,4K izləyici, gündə 3-5 DM | Qiymətin açıq görünməsi, gəlin makiyajı üçün razılaşma qiyməti | Səhifəni 3 dəqiqəyə qurur, ilk sifarişi həmin gün alır |
| **Aygün, repetitor** | Onlayn dərs, paket satışı | Aylıq paketlər üçün faktura, kim ödəyib izləmək | Ayın sonunda kimin borcu qaldığını 1 ekranda görür |
| **Pixel Lab, dizayn studiyası** | 3 nəfərlik komanda, USD ilə iş | Peşəkar faktura, valyuta seçimi, brend görünüşü | Karvan yazısı olmadan öz brendi ilə faktura göndərir |
| **Nərmin, müştəri** | Instagram-dan gəlir | Qiyməti görmək, tez sifariş, aydın rekvizit | 2 kliklə sifariş verir, fakturanı telefonunda açır |
| **Dəstək operatoru** | Karvan komandası | Şikayəti tez həll etmək | İstifadəçini tapır, problemi jurnaldan görür, şifrəni sıfırlayır |

---

## 7. Əsas biznes prosesləri

### 7.1 Satıcının yolu: qeydiyyatdan ilk ödənişə

```
Paket seçimi (ana səhifə)
        │
        ▼
Qeydiyyat (2 addım: şəxsi məlumat → hesab)
        │
        ├── pulsuz plan ──────────────► Səhifəm (profil qurma)
        └── Pro / Pro Max seçilibsə ──► Ödəniş səhifəsi ─► Abunəlik aktiv
                                                              │
                                                              ▼
                                   Xidmət əlavə et ─► Linki bio-ya qoy
                                                              │
                                                              ▼
                                   Müştəri sifariş verir ─► Faktura ─► Ödəniş ─► Analitika
```

### 7.2 Sifariş axını (xidmətin qiymət növündən asılı)

```
Müştəri xidməti seçir
        │
        ├── Sabit qiymət ─────► Forma ─► Faktura DƏRHAL yaranır ─► Faktura səhifəsi
        │                                      │
        │                                 (limit dolubsa → sorğuya çevrilir)
        │
        └── Razılaşma ilə ────► Forma (sorğu) ─► Satıcı panelində "təsdiq gözləyir"
                                                   │
                              Satıcı qiyməti yazır ─► Faktura yaranır
                                                   └─ imtina edir ─► Sorğu bağlanır
```

### 7.3 Ödənişin təsdiqi (müştəri fakturası)

```
Faktura göndərilir (SENT) ─► Müştəri açır (VIEWED)
        │
        ├─ Müştəri "Ödədim" basır ──► CLAIMED_PAID ─► Satıcı bankı yoxlayır
        │                                               ├─ "Pul gəlib"  ─► PAID
        │                                               └─ "Gəlməyib"   ─► SENT
        └─ Son tarix keçir ─────────► OVERDUE
```

### 7.4 Abunəlik ödənişi

```
Tarif + müddət seçimi (aylıq / illik)
        │
        ├── Bank kartı ──► Aqreqatorun səhifəsi ──► imzalı webhook ──► ACTIVATED (avtomatik)
        │                        │
        │                        └─ istifadəçi qayıdır ─► nəticə API-dən yoxlanılır
        │
        └── Bank köçürməsi ──► KRV-XXXXXX kodu ──► PENDING ──► Admin təsdiqi ──► ACTIVATED
```

### 7.5 Moderasiya

```
Şikayət / avtomatik nəzarət
        │
        ▼
Admin istifadəçini tapır ─► Fəaliyyət jurnalını oxuyur
        │
        ├─ Xidməti bloklayır (səhifədən və kataloqdan çıxır)
        ├─ Hesabı bloklayır (səbəb ilə; sessiyalar bağlanır)
        └─ Hesabı silir (e-poçtla təsdiq)
                │
                ▼
         Hər əməliyyat admin jurnalına yazılır
```

---

## 8. Tələblərin oxunması

Hər tələb **BR-\<modul\>-\<nömrə\>** formatındadır. "Vəziyyət" sütunu: ✅ hazır və yoxlanılıb · 🟡 qismən (məhdudiyyət qeyd olunub) · ⬜ planlaşdırılan.

---

## 9. Funksional tələblər

### 9.1 Hesab və autentifikasiya

| # | Tələb | Vəziyyət |
|---|---|---|
| BR-A-01 | Qeydiyyat 2 addımdan ibarətdir: ① ad, soyad, brend (könüllü), telefon, vətəndaşlıq, FİN/pasport ② səhifə ünvanı, e-poçt, şifrə | ✅ |
| BR-A-02 | Səhifə ünvanı (`username`) unikal: 3-30 simvol, `a-z 0-9 _ .`; qadağan olunmuş sözlər siyahısı (sistem yolları) | ✅ |
| BR-A-03 | Telefon ölkə kodu ilə seçilir (+994, +90, +995, +7, +998, +380, +49, +1), ölkəyə uyğun maskalanır, tam nömrə yapışdırılanda kod avtomatik tanınır | ✅ |
| BR-A-04 | Azərbaycan vətəndaşı FİN kod (7 simvol), xarici vətəndaş pasport nömrəsi (5-20) yazır; bu məlumat yalnız hesabın təsdiqi üçündür və səhifədə göstərilmir | ✅ |
| BR-A-05 | Giriş e-poçt + şifrə ilə; sessiya 30 gün | ✅ |
| BR-A-06 | Şifrə bərpası: e-poçta link (30 dəqiqə etibarlı, saatda ən çox 3 sorğu); bərpa bütün sessiyaları bağlayır | 🟡 e-poçt provayderi qoşulmayıb (§13.3) |
| BR-A-07 | Satıcı öz e-poçtunu və şifrəsini dəyişə, digər cihazlardan çıxa, hesabını silə bilər (ad təsdiqi + şifrə) | ✅ |
| BR-A-08 | Ana səhifədə ödənişli paket seçilibsə, qeydiyyat/girişdən sonra istifadəçi birbaşa həmin paketin ödəniş səhifəsinə düşür | ✅ |
| BR-A-09 | Bloklanmış hesab daxil ola bilmir, səbəb göstərilir | ✅ |

### 9.2 Satıcı səhifəsi (link-in-bio)

| # | Tələb | Vəziyyət |
|---|---|---|
| BR-P-01 | Ünvan: `karvan.az/<username>`; mobil-uyğun, satıcının brend rəngi ilə | ✅ |
| BR-P-02 | Profil: ad/brend, peşə, şəhər, qısa bio, profil şəkli/loqo, üz qabığı şəkli | ✅ |
| BR-P-03 | Sosial hesablar: Instagram, TikTok, WhatsApp, Telegram, YouTube, Facebook, LinkedIn, Behance, Dribbble, X, Threads, Pinterest, e-poçt, veb sayt + sərbəst linklər | ✅ |
| BR-P-04 | "Haqqımda" mətni (3000 simvola qədər) və "Gördüyüm işlər" portfoliosu (şəkil, ad, təsvir, link) | ✅ |
| BR-P-05 | Əlaqə nömrəsi "Zəng et" düyməsi kimi göstərilir; basanda zəng başlayır | ✅ |
| BR-P-06 | Xidmət kartında: ad, şəkil (könüllü), qiymət və ya "Razılaşma ilə", müddət, təsvir, "Sifariş et" | ✅ |
| BR-P-07 | Səhifənin yuxarısında "Ana səhifə" düyməsi və kataloqa qayıdan naviqasiya zənciri | ✅ |
| BR-P-08 | Pulsuz planda altda "Karvan ilə yaradılıb" yazısı; ödənişli planlarda yoxdur | ✅ |
| BR-P-09 | Pro və Pro Max hesablarda adın yanında təsdiqlənmiş nişanı | ✅ |
| BR-P-10 | Bloklanmış hesabın və bloklanmış xidmətin səhifəsi 404 qaytarır / xidmət görünmür | ✅ |
| BR-P-11 | Səhifə interfeysi çoxdilli deyil (Azərbaycan dilində) | 🟡 §9.12 |

### 9.3 Xidmətlər

| # | Tələb | Vəziyyət |
|---|---|---|
| BR-S-01 | Xidmət: ad, təsvir, sahə (12 kateqoriya), qiymət növü (sabit / razılaşma ilə), məbləğ, valyuta (AZN, USD, EUR), müddət (gün/həftə/ay), şəkil, sıra, aktiv/gizli | ✅ |
| BR-S-02 | Sahə "Digər" seçiləndə satıcı növü sərbəst mətnlə yazır; bu mətn kataloqda və axtarışda işləyir | ✅ |
| BR-S-03 | Məbləğlər qəpik/sentlə tam ədəd kimi saxlanılır; valyutalar qarışdırılmır | ✅ |
| BR-S-04 | AI xidmət təsvirinin 3 variantını təklif edir (§9.9) | ✅ |
| BR-S-05 | Xidmət sayı plan limiti ilə məhdudlaşır (5 / 30 / limitsiz) | ✅ |
| BR-S-06 | Panelin xidmətlər siyahısında axtarış və filtrlər (sahə, qiymət növü, status) | ✅ |

### 9.4 Xidmətlər kataloqu (kəşf kanalı)

| # | Tələb | Vəziyyət |
|---|---|---|
| BR-K-01 | Ünvanlar: `/xidmetler`, `/tr/hizmetler`, `/ru/uslugi`, `/en/services` | ✅ |
| BR-K-02 | Aktiv xidməti olan hər satıcı avtomatik kataloqda görünür | ✅ |
| BR-K-03 | Satıcı Parametrlərdən kataloqda görünməməyi seçə bilər | ✅ |
| BR-K-04 | Filtrlər: açar söz, sahə, şəhər, qiymət növü, valyuta, min/maks məbləğ, yalnız təsdiqlənmiş, sıralama (tövsiyə, yeni, ucuzdan, bahadan) | ✅ |
| BR-K-05 | Səhifədə 24 nəticə, səhifələmə | ✅ |
| BR-K-06 | "Tövsiyə olunan" sıralamada Pro Max hesablar önə çıxır və "Seçilmiş" nişanı alır | ✅ |
| BR-K-07 | Sahə və şəhər üçün klik edilə bilən linklər (axtarış sistemləri üçün də) | ✅ |
| BR-K-08 | Kartdan satıcının səhifəsinə keçid; sifariş orada verilir | ✅ |
| BR-K-09 | Rəy və reytinq | ⬜ |

### 9.5 Sifariş

| # | Tələb | Vəziyyət |
|---|---|---|
| BR-O-01 | Sifariş forması: ad, telefon (məcburi), e-poçt (könüllü), qeyd | ✅ |
| BR-O-02 | Forma X düyməsi, "Ləğv et" və Esc ilə bağlanır | ✅ |
| BR-O-03 | Sabit qiymətli xidmətdə faktura dərhal yaranır və müştəri faktura səhifəsinə yönləndirilir | ✅ |
| BR-O-04 | Razılaşma ilə xidmətdə sorğu `PENDING_APPROVAL` statusu ilə satıcıya düşür | ✅ |
| BR-O-05 | Satıcı sorğunu qiymət yazaraq təsdiqləyir (faktura yaranır) və ya imtina edir | ✅ |
| BR-O-06 | Satıcının aylıq faktura limiti dolubsa, sabit qiymətli sifariş itmir: sorğuya çevrilir | ✅ |
| BR-O-07 | Sifarişin gəldiyi mənbə (Instagram, TikTok, ...) qeyd olunur | ✅ |
| BR-O-08 | Panelin sifarişlər siyahısında axtarış, status, xidmət və tarix filtrləri | ✅ |
| BR-O-09 | Satıcıya anlıq bildiriş (e-poçt/SMS/push) | ⬜ §13.3 |

### 9.6 Faktura və PDF

| # | Tələb | Vəziyyət |
|---|---|---|
| BR-F-01 | Nömrə formatı `<prefiks>-<il>-<sıra>` (məs. `AYG-2026-0042`), hər satıcı üçün ayrıca sıra; paralel sorğularda nömrə təkrarlanmır (sətir kilidi) | ✅ |
| BR-F-02 | Faktura məzmunu: satıcı, müştəri, sətirlər (xidmət, say, qiymət), cəm, tarix, son ödəniş tarixi, rekvizitlər, QR kod, qeyd | ✅ |
| BR-F-03 | İctimai faktura səhifəsi `/i/<publicId>`: təxmin edilə bilməyən 12 simvollu ID | ✅ |
| BR-F-04 | PDF server tərəfdə yaranır, Azərbaycan hərflərini dəstəkləyən şriftlə | ✅ |
| BR-F-05 | PDF-də satıcının brend rəngi; pulsuz planda platforma yazısı | ✅ |
| BR-F-06 | Satıcı müştərisiz də faktura yarada bilər (DM-də razılaşdırılmış iş üçün), sətirləri əl ilə və ya AI ilə doldurur | ✅ |
| BR-F-07 | WhatsApp-a hazır mətnlə göndərmə linki və linkin kopyalanması | ✅ |
| BR-F-08 | Statuslar: `DRAFT`, `SENT`, `VIEWED`, `CLAIMED_PAID`, `PAID`, `OVERDUE`, `CANCELLED` | ✅ |
| BR-F-09 | Fakturalar siyahısında status, valyuta və tarix filtrləri | ✅ |

### 9.7 Ödəniş izləmə (müştəri → satıcı)

| # | Tələb | Vəziyyət |
|---|---|---|
| BR-Ö-01 | Manual ödəniş: fakturada kart nömrəsi, IBAN, bank və alıcının adı göstərilir, kopyalama düyməsi ilə | ✅ |
| BR-Ö-02 | Müştəri "Ödədim" basır → status `CLAIMED_PAID`; satıcı "Pul gəlib" / "Gəlməyib" ilə qərar verir | ✅ |
| BR-Ö-03 | Panel: bu ay ödənilən, gözlənilən məbləğ, gecikənlər, təsdiq gözləyən sorğular | ✅ |
| BR-Ö-04 | Pul platformadan keçmir: birbaşa satıcının hesabına gedir, komissiya alınmır | ✅ |
| BR-Ö-05 | Müştərinin fakturanı kartla onlayn ödəməsi | ⬜ Aqreqator abunəlik üçün qoşulub; faktura üçün genişləndirmə tələb olunur |
| BR-Ö-06 | Qəbz şəklinin yüklənməsi və AI ilə yoxlanması | ⬜ |

### 9.8 Analitika (satıcı)

| # | Tələb | Vəziyyət |
|---|---|---|
| BR-AN-01 | Dövrlər: 7 / 30 / 90 gün; hər göstərici əvvəlki eyni dövrlə müqayisə olunur | ✅ |
| BR-AN-02 | Satış göstəriciləri: gəlir, sifariş sayı, orta çek, ödənilmə dərəcəsi, orta ödəniş müddəti, gözlənilən və gecikmiş məbləğ, qayıdan müştəri payı | ✅ |
| BR-AN-03 | Auditoriya: unikal ziyarətçi, baxış, konversiya, zəng və link klikləri, yeni/qayıdan ziyarətçi, cihaz bölgüsü | ✅ |
| BR-AN-04 | Satış qıfı: baxan → forma açan → sifariş verən → ödəyən | ✅ |
| BR-AN-05 | Trafik mənbələri: Instagram, TikTok, WhatsApp, Facebook, Telegram, axtarış, birbaşa, digər | ✅ |
| BR-AN-06 | Xidmətlərin performansı (forma açılışı, sifariş, çevrilmə, gəlir) və ən çox klik edilən linklər | ✅ |
| BR-AN-07 | Rəqəmlərə əsaslanan avtomatik tövsiyələr | ✅ |
| BR-AN-08 | Mənbəni dəqiq ölçmək üçün etiketli linklər (`?s=ig`, `?s=tt`, ...) | ✅ |
| BR-AN-09 | Hesabatın Excel (CSV) formatında ixracı — yalnız Pro Max | ✅ |
| BR-AN-10 | Ziyarətçi anonim sayılır (şəxsi məlumat yığılmır); botlar və satıcının öz baxışları sayılmır | ✅ |

### 9.9 AI köməkçi

| # | Funksiya | Giriş → Çıxış | Vəziyyət |
|---|---|---|---|
| BR-AI-01 | **Mətndən faktura** | "Aygün, 3 dərs 50 manatdan, cüməyə qədər" → müştəri, sətirlər, son tarix + xəbərdarlıqlar | ✅ |
| BR-AI-02 | **Xidmət təsviri** | ad + açar sözlər → 3 satış mətni | ✅ |
| BR-AI-03 | **Brend rəngi** | bio + sahə → rəng palitrası + izah | ✅ |
| BR-AI-04 | **Ödəniş xatırlatması** | faktura + gecikmə + ton → hazır mesaj | ✅ |
| BR-AI-05 | AI çıxışı heç vaxt avtomatik göndərilmir: satıcı yoxlayıb təsdiqləyir | ✅ |
| BR-AI-06 | Təminatçı seçilə bilir: Groq, Gemini, OpenRouter, Ollama (pulsuz/lokal) və ya Claude (ödənişli) | ✅ |
| BR-AI-07 | Açar admin paneldə bir dəfə yazılır, bazada şifrələnmiş saxlanılır, saytın yenidən başladılması tələb olunmur | ✅ |
| BR-AI-08 | Aylıq AI sorğu limiti plana görə tətbiq olunur (10 / 200 / 1000) | ✅ |
| BR-AI-09 | Quraşdırma xətasının detalını yalnız admin görür, satıcıya sadə mesaj göstərilir | ✅ |

### 9.10 Abunəlik və monetizasiya

| | **Pulsuz** | **Pro** — 9,99 AZN/ay | **Pro Max** — 29,99 AZN/ay |
|---|---|---|---|
| Link-in-bio səhifə | ✅ | ✅ | ✅ |
| Sifariş | limitsiz | limitsiz | limitsiz |
| Faktura / ay | 5 | 100 | limitsiz |
| Xidmət | 5 | 30 | limitsiz |
| Təsdiqlənmiş nişanı | — | ✅ | ✅ |
| "Karvan ilə yaradılıb" yazısı | var | yoxdur | yoxdur |
| Kataloqda önə çıxma | — | — | ✅ |
| Excel hesabat | — | — | ✅ |
| Komanda üzvü | 1 | 1 | 5 ⬜ |
| AI sorğu / ay | 10 | 200 | 1000 |

| # | Tələb | Vəziyyət |
|---|---|---|
| BR-AB-01 | Aylıq və illik ödəniş; illik ödənişdə 2 ay pulsuz (10 ayın qiyməti) | ✅ |
| BR-AB-02 | Ödəniş üsulları: bank kartı (aqreqator) və bank köçürməsi (`KRV-XXXXXX` kodu ilə) | ✅ |
| BR-AB-03 | Kart məlumatı Karvan-a daxil edilmir: istifadəçi aqreqatorun səhifəsinə yönləndirilir | ✅ |
| BR-AB-04 | Kart ödənişi imzalı webhook ilə təsdiqlənir; təkrar bildiriş müddəti ikiqat uzatmır; məbləğ uyğun gəlmirsə aktivləşmir | ✅ |
| BR-AB-05 | Webhook gəlməsə, istifadəçi qayıdanda nəticə aqreqatorun API-sindən yoxlanılır | ✅ |
| BR-AB-06 | Köçürmə ödənişini admin təsdiqləyir və ya rədd edir | ✅ |
| BR-AB-07 | Ödənişdən sonra istifadəçiyə bildiriş: "15 dəqiqə ərzində hesabınız abunəliyinizə uyğun formalaşdırılacaq" | ✅ |
| BR-AB-08 | Eyni tarif uzadılanda yeni müddət köhnənin üstünə əlavə olunur | ✅ |
| BR-AB-09 | Müddət bitəndə tarif avtomatik Pulsuza qayıdır, məlumatlar saxlanılır | ✅ |
| BR-AB-10 | Abunəlik avtomatik yenilənmir (təkrar ödəniş istifadəçinin qərarıdır) | ✅ |
| BR-AB-11 | Tarif dəyişəndə köhnə tarifin qalan müddəti nəzərə alınmır | 🟡 Məhdudiyyət: §20 |
| BR-AB-12 | Satıcı ödəniş tarixçəsini paneldə görür | ✅ |

### 9.11 Admin panel

| # | Tələb | Vəziyyət |
|---|---|---|
| BR-AD-01 | İcmal: istifadəçi sayı, yeni qeydiyyatlar, plan bölgüsü, təxmini MRR, platforma dövriyyəsi, sifariş/faktura/baxış sayları, günlük qeydiyyat qrafiki, son fəaliyyət | ✅ |
| BR-AD-02 | İstifadəçilər: axtarış (ad, e-poçt, telefon, ünvan), plan və status filtrləri | ✅ |
| BR-AD-03 | Sətirdən sürətli əməliyyatlar: tarifi qaldır/sal, blokla/bloku götür, dəyiş | ✅ |
| BR-AD-04 | Toplu əməliyyatlar: seçilmiş hesablara tarif, bloklama, blokun götürülməsi, bütün cihazlardan çıxarma | ✅ |
| BR-AD-05 | İstifadəçi səhifəsi: məlumat, statistika, xidmətlər, fakturalar, fəaliyyət zaman xətti | ✅ |
| BR-AD-06 | Məlumat düzəlişi (ad, e-poçt, telefon, ünvan, peşə, şəhər); dəyişiklik jurnalda köhnə/yeni dəyərlə qalır | ✅ |
| BR-AD-07 | Bloklama səbəblə aparılır, hesab dərhal çıxış edir, səhifəsi və xidmətləri gizlənir | ✅ |
| BR-AD-08 | Hesabın silinməsi e-poçtla təsdiq tələb edir; admin hesabı silinmir/bloklanmır | ✅ |
| BR-AD-09 | Şifrə: admin yeni şifrə təyin edir və ya müvəqqəti şifrə yaradır (hazırkı şifrə heç kimə göstərilmir) | ✅ |
| BR-AD-10 | Xidmət moderasiyası: bloklanan xidmət səhifədə və kataloqda görünmür, satıcı səbəbi görür | ✅ |
| BR-AD-11 | Ödənişlər: gözləyən köçürmələr, gəlir göstəriciləri, təsdiq/rədd | ✅ |
| BR-AD-12 | Jurnal iki bölmədə: istifadəçi fəaliyyəti (32 hadisə növü, IP ilə) və admin əməliyyatları (14 növ) | ✅ |
| BR-AD-13 | İstifadəçilərin və jurnalların Excel (CSV) ixracı; sənəd nömrələri ixraca düşmür | ✅ |
| BR-AD-14 | Super admin: rol təyinatı, istifadəçi kimi daxil olmaq (2 saat, jurnala yazılır, qayıdış zolağı ilə), AI ayarı | ✅ |
| BR-AD-15 | Adi istifadəçi `/admin` ünvanında 404 görür (bölmənin varlığı gizli qalır) | ✅ |

### 9.12 Çoxdillilik və görünüş

| # | Tələb | Vəziyyət |
|---|---|---|
| BR-L-01 | Dillər: Azərbaycan (əsas), türk, rus, ingilis | ✅ |
| BR-L-02 | Hər dilin öz ünvanı: `/`, `/tr`, `/ru`, `/en` və kataloq qarşılıqları | ✅ |
| BR-L-03 | Dil seçimi header və footer-də; seçim cookie-də yadda qalır | ✅ |
| BR-L-04 | Giriş/qeydiyyat səhifələri və server xəta mesajları seçilmiş dildə | ✅ |
| BR-L-05 | İşıqlı/qaranlıq rejim; seçim yadda qalır, ilk dəfə sistem ayarına baxılır, səhifə yüklənəndə "parıltı" olmur | ✅ |
| BR-L-06 | Satıcı səhifəsi, faktura səhifəsi, satıcı paneli və admin panel Azərbaycan dilindədir | 🟡 Genişləndirmə: §19 |

### 9.13 SEO

| # | Tələb | Vəziyyət |
|---|---|---|
| BR-SEO-01 | Açar sözə uyğun başlıq (≈60 simvol) və təsvir (150-160 simvol), 4 dildə | ✅ |
| BR-SEO-02 | Hər səhifədə canonical və 4 dil üçün hreflang (+ x-default) | ✅ |
| BR-SEO-03 | Kataloqun sahə və sahə+şəhər səhifələri indeksləşir, başlıq və H1 həmin sahəni göstərir | ✅ |
| BR-SEO-04 | Qiymət/sıralama/səhifə filtrləri `noindex` alır, canonical əsas səhifəni göstərir | ✅ |
| BR-SEO-05 | Strukturlu məlumat: Organization, WebSite (axtarış), SoftwareApplication, FAQPage, CollectionPage + ItemList, ProfessionalService + Offer, BreadcrumbList | ✅ |
| BR-SEO-06 | Paylaşım şəkilləri (Open Graph) avtomatik yaranır: ana səhifə, kataloq və satıcı üçün | ✅ |
| BR-SEO-07 | `sitemap.xml`: dil versiyaları, sahə səhifələri, satıcılar (son dəyişiklik tarixi ilə); `robots.txt` şəxsi bölmələri bağlayır | ✅ |
| BR-SEO-08 | Satıcı səhifəsi uzun-quyruq sorğular üçün optimallaşdırılıb (peşə + şəhər + xidmət adları) | ✅ |

### 9.14 Bildirişlər

| # | Tələb | Vəziyyət |
|---|---|---|
| BR-N-01 | Fakturanın WhatsApp ilə paylaşılması (`wa.me` linki) | ✅ |
| BR-N-02 | Şifrə bərpası məktubu | 🟡 Kod hazırdır, provayder açarı yoxdur |
| BR-N-03 | Yeni sifariş / ödəniş bildirişi (e-poçt, SMS, push) | ⬜ |
| BR-N-04 | Avtomatik ödəniş xatırlatmaları (son tarixdən əvvəl və sonra) | ⬜ AI mətni hazırdır, avtomatik göndərmə yoxdur |

---

## 10. Biznes qaydaları

| # | Qayda |
|---|---|
| BQ-01 | Faktura limiti təqvim ayı üzrə sayılır; `CANCELLED` fakturalar da limitə daxildir (sui-istifadənin qarşısını almaq üçün) |
| BQ-02 | Fərqli valyutalardakı məbləğlər toplanmır: hər valyuta ayrıca göstərilir |
| BQ-03 | Faktura nömrəsi silinmir və təkrar istifadə olunmur |
| BQ-04 | Satıcı yalnız öz məlumatına çıxış əldə edir; müştəri telefonu başqa satıcıya görünmür |
| BQ-05 | FİN kod və pasport nömrəsi interfeysdə maskalanır (son 3 simvol), ixraca düşmür |
| BQ-06 | Şifrələr geri açılmayan şəkildə (scrypt) saxlanılır: heç bir rol onu görə bilmir |
| BQ-07 | Şifrə dəyişdirildikdə və ya admin tərəfindən təyin edildikdə bütün sessiyalar bağlanır |
| BQ-08 | Bloklanmış hesabın səhifəsi, xidmətləri və kataloq qeydləri dərhal gizlənir |
| BQ-09 | Abunəlik ödənişi yalnız imza və məbləğ yoxlanışından sonra aktivləşir |
| BQ-10 | Kart ödənişi 1 saat ərzində tamamlanmasa, ödəniş "alınmadı" kimi bağlanır |
| BQ-11 | Hesab silinəndə profil, xidmətlər, sifarişlər, fakturalar və şəkillər silinir; jurnal qeydləri (e-poçt ilə) saxlanılır |
| BQ-12 | AI nəticəsi heç vaxt avtomatik göndərilmir |
| BQ-13 | Admin başqa admini bloklaya, silə bilməz; super admin öz rolunu sonuncu super admin kimi itirə bilməz |
| BQ-14 | Hər admin əməliyyatı jurnala yazılır və geri silinmir |

---

## 11. Məlumat modeli

```
User (rol, blok, FİN/pasport)
 ├─1:1─ Subscription (plan, müddət sonu)
 ├─1:N─ Session · PasswordReset · SubscriptionPayment
 └─1:1─ Profile (username, brend, rəng, rekvizit, kataloq görünüşü)
          ├─1:N─ SocialLink · PortfolioItem · Media
          ├─1:N─ Service (qiymət növü, valyuta, müddət, şəkil, moderasiya)
          ├─1:N─ Order ──0:1── Invoice ─1:N─ InvoiceItem
          │                      ├─1:N─ Payment
          │                      └─1:N─ Reminder
          └─1:N─ ProfileEvent (baxış, forma, zəng, link klikləri)

Sistem: AdminLog · ActivityLog · AppSetting (şifrələnmiş ayarlar)
```

Tam sxem və 14 miqrasiya: [`prisma/schema.prisma`](../prisma/schema.prisma), [`prisma/migrations/`](../prisma/migrations/).

---

## 12. Qeyri-funksional tələblər

| Sahə | Tələb | Vəziyyət |
|---|---|---|
| **Performans** | Produksiya rejimində lokal ölçmə: ictimai səhifə 0,10-0,23 s, PDF 0,11-0,77 s (hədəf: səhifə < 2 s, PDF < 3 s) | ✅ |
| **Mobil** | Bütün səhifələr telefonda üfüqi sürüşmə olmadan işləyir | ✅ |
| **Əlçatanlıq** | Klaviatura ilə naviqasiya, `aria` etiketləri, kontrast, `prefers-reduced-motion` dəstəyi | ✅ |
| **Təhlükəsizlik** | Şifrələr scrypt; sessiya cookie-si hash ilə saxlanılır; ictimai faktura ID-si təxmin edilə bilməz; webhook imzası yoxlanılır; kart məlumatı serverdə saxlanılmır; yüklənən şəkillərin sahibliyi yoxlanılır; linklərdə yalnız `http(s)`/`mailto` | ✅ |
| **Məxfilik** | Analitikada şəxsi məlumat yoxdur; sənəd nömrələri maskalanır; hesab silinəndə məlumat silinir | ✅ |
| **Dayanıqlıq** | Təkrar webhook, itmiş bildiriş və yarımçıq ödəniş halları idarə olunur; AI və e-poçt xətası əsas əməliyyatı dayandırmır | ✅ |
| **İzlənilənlik** | İstifadəçi fəaliyyəti və admin əməliyyatları jurnalda | ✅ |
| **Quraşdırma** | `npm run dev` bazanı, miqrasiyaları, Prisma klientini və demo məlumatı özü hazırlayır | ✅ |
| **Rate limit** | Sifariş forması və AI endpoint-ləri üçün IP əsaslı məhdudiyyət | ⬜ AI üçün plan limiti var; IP limiti əlavə olunmalıdır |

---

## 13. İnteqrasiyalar

### 13.1 Ödəniş aqreqatoru (abunəlik)

| | |
|---|---|
| Dəstəklənən | **Epoint** (`PAYMENT_GATEWAY=epoint`), **Payriff** (`payriff`), test rejimi (`sandbox`) |
| Axın | Yönləndirmə → aqreqatorun səhifəsi → imzalı webhook → aktivləşmə |
| Webhook ünvanı | `https://<domen>/api/payments/webhook/<provider>` |
| Qoruma | İmza yoxlanışı, məbləğ uyğunluğu, təkrar bildirişə qarşı atomik "tutma", API-dən təsdiq (Payriff-in callback-i imzasız olduğu üçün nəticə həmişə API-dən soruşulur) |
| Vəziyyət | 🟡 Kod hazırdır, real hesab açarları ilə sınaqdan keçirilməyib |

### 13.2 AI

| | |
|---|---|
| Təminatçılar | Groq, Google Gemini, OpenRouter, Ollama (lokal), Anthropic Claude |
| Seçim | Admin → Parametrlər → AI (bazada şifrələnmiş) və ya `.env` |
| Məhdudiyyət | Pulsuz təminatçılarda sorğu limitləri var; Gemini-nin pulsuz tarifində məlumat modelin təkmilləşdirilməsi üçün istifadə oluna bilər (canlıda ödənişli tarif və ya Ollama tövsiyə olunur) |

### 13.3 Bildiriş kanalları ⬜

| Kanal | Status | Tələb |
|---|---|---|
| E-poçt | Kod hazır (Resend) | `RESEND_API_KEY`, domen təsdiqi |
| SMS | Yoxdur | Yerli provayder müqaviləsi |
| WhatsApp | `wa.me` linki ✅ | Avtomatik göndərmə üçün Business API |

### 13.4 Saxlama

Şəkillər hazırda bazada saxlanılır (`Media`). Satıcı sayı artdıqca S3-uyğun saxlamaya (Cloudflare R2) keçid tövsiyə olunur. 🟡

---

## 14. Hesabatlıq

| Hesabat | Kim üçün | Yer | İxrac |
|---|---|---|---|
| Satış və auditoriya analitikası | Satıcı | `/dashboard/analytics` | CSV (Pro Max) |
| Platforma icmalı və MRR | Admin | `/admin` | — |
| İstifadəçi siyahısı | Admin | `/admin/users` | CSV |
| Fəaliyyət və admin jurnalı | Admin | `/admin/logs` | CSV |
| Abunəlik ödənişləri | Admin | `/admin/payments` | — |

---

## 15. Hüquqi və uyğunluq

### 15.1 Ödəniş axını

Pul platformada toplanmır: müştəri birbaşa satıcının kartına və ya hesabına köçürür. Bu model platformanı ödəniş vasitəçisi statusundan və onunla bağlı lisenziya tələblərindən kənarda saxlayır. Müştəri fakturasının onlayn ödənişi (BR-Ö-05) əlavə olunarsa, hər satıcının aqreqatorda öz merchant hesabını açması modeli tövsiyə olunur.

### 15.2 Sənədin statusu

Faktura **qeyri-rəsmi ödəniş sorğusudur**; PDF-də "Bu sənəd ödəniş sorğusudur, rəsmi vergi sənədi deyil" qeydi var. VÖEN və e-qaimə dəstəyi növbəti mərhələdədir.

### 15.3 Lansdan əvvəl tələb olunan ⬜

- İstifadə şərtləri və məxfilik siyasəti səhifələri (hüquqşünas yoxlaması ilə)
- Şəxsi məlumatların işlənməsi barədə məlumatlandırma (satıcı müştəri məlumatını daxil edir)
- Cookie barədə bildiriş (analitika cookie-si: anonim ziyarətçi id-si)

---

## 16. Risklər

| # | Risk | Təsir | Azaldıcı tədbir |
|---|---|---|---|
| R1 | Aqreqator inteqrasiyasının sahə adları sənəddən fərqlənir | Kart ödənişi işləməz | Test mühitində ilk ödəniş; düzəliş tək faylda (`billing-gateway.ts`) |
| R2 | Pulsuz AI modelinin keyfiyyəti aşağıdır | "Mətndən faktura" səhv nəticə verir | Satıcı hər nəticəni təsdiqləyir; təminatçı dəyişdirilə bilir |
| R3 | Kataloqda saxta və ya keyfiyyətsiz elanlar | Platformaya etibar azalır | Moderasiya (BR-AD-10), bloklama, jurnal |
| R4 | Bildirişlərin olmaması | Satıcı sifarişi gec görür | Prioritet: e-poçt provayderinin qoşulması (§19) |
| R5 | Şəkillərin bazada saxlanması | Baza böyüyür, performans düşür | S3/R2-yə keçid planı (§13.4) |
| R6 | Abunəlik avtomatik yenilənmir | Gəlir itkisi | Xatırlatma e-poçtu + avtomatik yenilənmə (v2) |
| R7 | `APP_SECRET` olmadan canlıya çıxış | AI açarı saxlanmır | Buraxılış siyahısında məcburi bənd (§18) |
| R8 | Tək super admin hesabının itirilməsi | İdarəetmə bağlanır | `npm run admin -- e-poçt şifrə --super` ilə bərpa |

---

## 17. Reallaşma xülasəsi

| Modul | Vəziyyət |
|---|---|
| Hesab, səhifə, xidmətlər, sifariş, faktura, PDF, manual ödəniş izləmə | ✅ tam |
| Xidmətlər kataloqu və SEO | ✅ tam (rəy sistemi istisna) |
| Satıcı analitikası | ✅ tam |
| AI köməkçi (4 funksiya, 5 təminatçı) | ✅ tam |
| Abunəlik, ödəniş səhifəsi, admin təsdiqi | ✅ tam · 🟡 real aqreqator sınağı qalır |
| Admin panel, moderasiya, jurnallar, ixrac | ✅ tam |
| Çoxdillilik (ziyarətçi səhifələri) | ✅ 4 dil · 🟡 satıcı səhifəsi və panel AZ |
| Bildirişlər | 🟡 WhatsApp linki var, avtomatik göndərmə yoxdur |
| Müştəri fakturasının onlayn ödənişi, komanda, rəylər, VÖEN | ⬜ |

---

## 18. Buraxılış şərtləri (go-live)

| # | Şərt | Məsul |
|---|---|---|
| G1 | `NEXT_PUBLIC_APP_URL` real domenə yönləndirilib | Texniki |
| G2 | `APP_SECRET` təyin edilib (uzun təsadüfi mətn) | Texniki |
| G3 | Ödəniş aqreqatoru seçilib, açarlar yazılıb, webhook ünvanı kabinetdə göstərilib, test ödənişi uğurla keçib | Biznes + Texniki |
| G4 | Bank rekvizitləri (`BILLING_IBAN`, `BILLING_VOEN`, `BILLING_BANK`) yazılıb | Biznes |
| G5 | AI açarı admin paneldə yazılıb və "AI-ı yoxla" uğurlu cavab verib | Super admin |
| G6 | E-poçt provayderi qoşulub (şifrə bərpası üçün minimum tələb) | Texniki |
| G7 | İstifadə şərtləri və məxfilik siyasəti dərc olunub | Hüquq |
| G8 | Super admin hesabı yaradılıb, demo hesab silinib və ya gizlədilib | Super admin |
| G9 | Sayt Google Search Console-a əlavə olunub, `sitemap.xml` göndərilib | Marketinq |
| G10 | Ehtiyat nüsxə qaydası müəyyən edilib (baza gündəlik) | Texniki |

---

## 19. Yol xəritəsi

| Mərhələ | Məzmun | Biznes əsası |
|---|---|---|
| **v1.1 — Bildirişlər** | E-poçt provayderi, yeni sifariş və ödəniş bildirişləri, avtomatik xatırlatmalar | Ödənilmə nisbətini artırır (M3), satıcı reaksiyasını sürətləndirir |
| **v1.2 — Müştəri ödənişi** | Fakturanın kartla onlayn ödənişi (hər satıcı öz merchant hesabı ilə) | Ödəniş sürəti (M4), Pro plana keçid motivi (M5) |
| **v1.3 — Kataloqun gücləndirilməsi** | Rəy və reytinq, `/xidmetler/gozellik` tipli ünvanlar, şəhər səhifələri | Orqanik trafik (M6) |
| **v1.4 — Komanda** | Pro Max-da 5 üzv, rol bölgüsü | Studiyalar üçün Pro Max dəyəri |
| **v2 — Rəsmiləşmə** | VÖEN, e-qaimə inteqrasiyası, avtomatik abunəlik yenilənməsi | Böyük satıcılar və saxlanma (M7) |

---

## 20. Məlum məhdudiyyətlər

1. **Tarif dəyişəndə qalan müddət itir** (BR-AB-11): illik Pro-dan Pro Max-a keçəndə qalan aylar nəzərə alınmır. Həlli: qalan müddətin dəyərini yeni tarifdən çıxmaq.
2. **Satıcı səhifəsi yalnız Azərbaycan dilindədir** (BR-L-06): xarici müştəri sifariş formasını başa düşməyə bilər.
3. **Avtomatik bildiriş yoxdur**: satıcı yeni sifarişi panelə girəndə görür.
4. **Fəaliyyət jurnalı yalnız bu versiyadan sonrakı hadisələri saxlayır**.
5. **Pulsuz AI modellərinin dil keyfiyyəti** Claude səviyyəsində deyil, xüsusilə mətndən faktura çıxarmaqda.
6. **Şəkillər bazadadır**: böyük həcmdə fayl saxlama xidmətinə keçid lazımdır.
7. **IP əsaslı rate limit yoxdur**: sifariş formasının sui-istifadəsinə qarşı əlavə qoruma tələb olunur.

---

## 21. Qəbul meyarları (nümunə ssenarilər)

| # | Ssenari | Gözlənilən nəticə |
|---|---|---|
| QM-01 | Yeni satıcı qeydiyyatdan keçir, 1 sabit qiymətli xidmət əlavə edir, müştəri sifariş verir | Faktura avtomatik yaranır, nömrə verilir, PDF açılır |
| QM-02 | Pulsuz planda 6-cı faktura yaradılır | Limit mesajı göstərilir, sifariş sorğuya çevrilir |
| QM-03 | Müştəri "Ödədim" basır, satıcı təsdiqləyir | Status `PAID`, analitikada gəlirə düşür |
| QM-04 | Pro Max seçilir, kartla ödənilir | Webhook-dan sonra tarif aktivləşir, təsdiqlənmiş nişanı görünür |
| QM-05 | Eyni webhook iki dəfə gəlir | Müddət bir dəfə uzanır |
| QM-06 | Admin hesabı bloklayır | Hesab çıxış edir, səhifə 404, xidmətlər kataloqdan çıxır, jurnalda qeyd |
| QM-07 | Super admin istifadəçi kimi daxil olur | Bənövşəyi zolaq görünür, jurnalda qeyd, qayıdış işləyir |
| QM-08 | Kataloqda `?category=beauty` açılır | H1 sahə adını göstərir, səhifə indeksləşir, hreflang 4 dildədir |
| QM-09 | Ödənişli planda satıcı səhifəsi açılır | "Karvan ilə yaradılıb" yazısı yoxdur |
| QM-10 | Müddəti bitmiş Pro hesabı daxil olur | Tarif Pulsuza qayıdır, məlumatlar yerindədir |

---

## 22. Lüğət

| Termin | İzah |
|---|---|
| **Satıcı** | Karvan-da hesabı olan, xidmət satan şəxs |
| **Səhifə ünvanı** | `karvan.az/<username>` — satıcının ictimai səhifəsi |
| **Razılaşma ilə** | Qiyməti əvvəlcədən müəyyən olmayan xidmət; satıcı sorğunu təsdiqləyəndə qiymət yazılır |
| **Ödəniş kodu** | `KRV-XXXXXX` — bank köçürməsində təyinat sahəsinə yazılan unikal kod |
| **Webhook** | Ödəniş sisteminin nəticəni serverə göndərdiyi imzalı bildiriş |
| **Aqreqator** | Kart ödənişlərini qəbul edən vasitəçi (Epoint, Payriff) |
| **MRR** | Aylıq təkrarlanan gəlir (abunəliklərin cəmi) |
| **Uzun-quyruq axtarış** | "makiyaj ustası Bakı" kimi dar, lakin niyyəti aydın sorğular |
| **Canonical** | Təkrar ünvanlar arasında axtarış sisteminə göstərilən əsas ünvan |

---

## 23. Açıq suallar

| # | Sual | Qərar verən |
|---|---|---|
| S1 | Hansı aqreqator seçilir: Epoint, yoxsa Payriff (komissiya, payout müddəti, fiziki şəxslə müqavilə)? | Biznes |
| S2 | `*0221` nömrəsi və `hello@karvan.az` ünvanı real əlaqə kanallarıdırmı? | Biznes |
| S3 | Müştəri fakturasının onlayn ödənişində model: hər satıcının öz merchant hesabı, yoxsa platforma hesabı? | Biznes + Hüquq |
| S4 | Pulsuz planda satıcı sayı artanda AI limitinin dəyəri saxlanılsınmı (xərc nəzarəti)? | Biznes |
| S5 | Kataloqda rəy sistemi hansı mərhələdə açılır (sui-istifadə riski ilə birlikdə)? | Məhsul |

---

*Sənəd reallaşdırılmış məhsula əsasən hazırlanıb. Dəyişiklik olduqda müvafiq BR bəndi və §17 cədvəli yenilənməlidir.*
