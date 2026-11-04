# Dəstək təlimatı

Karvan dəstək komandası üçün gündəlik prosedurlar. BRD §19 (keçid tələbləri) və §8.3 (rollar) ilə uyğundur.

---

## 1. Rollar və icazələr

| Rol | Nə edə bilir | Nə edə bilmir |
|---|---|---|
| **Admin** | İstifadəçi axtarışı, məlumat düzəlişi, tarif dəyişmək, bloklamaq, moderasiya, köçürmə təsdiqi, jurnal və ixrac | Başqa admini bloklaya/silə bilməz; rol təyin edə bilməz |
| **Super admin** | Admin imkanları + rol təyinatı, istifadəçi kimi daxil olmaq, AI ayarları | Sonuncu super admin öz rolunu götürə bilməz |

Hər admin əməliyyatı jurnala yazılır və silinmir (BRU-15). İstifadəçiyə "sizin hesabınıza girmişəm" deyil, **"istifadəçi kimi baxış" rejimi** istifadə olunur: ekranda xəbərdarlıq zolağı görünür, 2 saatdan sonra avtomatik bitir.

---

## 2. Müraciət növləri və SLA

| Növ | İlk cavab | Həll |
|---|---|---|
| Ödəniş təsdiqlənmir (bank köçürməsi) | 4 saat (iş günü) | 1 iş günü |
| Hesaba giriş problemi | 4 saat | 1 iş günü |
| Məzmun şikayəti | 1 iş günü | 2 iş günü |
| Ümumi sual | 1 iş günü | — |

---

## 3. Tez-tez rast gəlinən hallar

### 3.1 "Şifrəmi unutmuşam" / girişdən keçmir

1. `/admin/users` → istifadəçini e-poçt və ya telefonla tapın.
2. Hesabın **bloklanmadığını** yoxlayın (bloklanıbsa səbəb göstərilir).
3. Fəaliyyət jurnalında `login_failed` qeydlərinə baxın — nömrə/e-poçt səhvdirsə istifadəçiyə deyin.
4. Lazım olarsa **müvəqqəti şifrə** yaradın və istifadəçiyə ötürün; o, daxil olub dəyişməlidir.

> Mövcud şifrəni heç kim görə bilmir — geri açılmayan formada saxlanılır (BRU-06). "Şifrəni deyin" tələbi yerinə yetirilmir.

### 3.2 "Pulu köçürdüm, tarifim aktivləşmədi"

1. `/admin/payments` → ödəniş kodu (`KRV-XXXXXX`) və ya e-poçtla axtarın.
2. Status `PENDING`-dirsə: bank hesabına məbləğin daxil olduğunu yoxlayın → **Təsdiqlə**. Tarif dərhal aktivləşir.
3. Status `FAILED` / `REJECTED`-dirsə: səbəb qeyddə yazılır; istifadəçiyə yenidən ödəniş təklif edin.
4. Kart ödənişi `PENDING` qalıbsa: istifadəçi ödəniş səhifəsinə qayıtsın — nəticə aqreqatorun API-sindən yoxlanılır. 1 saatdan sonra ödəniş avtomatik bağlanır (BRU-11).

### 3.3 "Müştəri ödəyib, amma faktura hələ də ödənilməmiş görünür"

Bu, platformanın işi deyil: pul birbaşa satıcıya gedir. Satıcı öz bankını yoxlayıb fakturada **"Pul gəlib"** düyməsini basmalıdır. Dəstək yalnız izah verir, statusu özü dəyişmir.

### 3.4 Məzmun şikayəti

1. Şikayət olunan səhifəni/xidməti açın.
2. Qaydalara (`/qaydalar`, §4) uyğunluğunu yoxlayın.
3. Yalnız bir xidmət qaydaları pozursa → **xidməti bloklayın** (hesab açıq qalır).
4. Hesab bütövlükdə saxta/qadağan fəaliyyətdirsə → **səbəb yazaraq hesabı bloklayın**. Sessiyalar dərhal bağlanır, səhifə 404 verir.
5. Satıcı səbəbi öz panelində görür; etiraz edərsə, jurnalı yoxlayıb qərarı yenidən nəzərdən keçirin.

### 3.5 "Hesabımı silin"

1. İstifadəçi bunu özü edə bilər: Parametrlər → Hesabı sil (ad təsdiqi + şifrə).
2. Admin tərəfindən silinmə e-poçt təsdiqi tələb edir.
3. Silinmədən sonra profil, xidmətlər, sifarişlər, fakturalar və şəkillər gedir; jurnal qeydləri qalır (BRU-12). Geri qaytarılmır — istifadəçiyə əvvəlcədən deyin.

### 3.6 "Tarifi dəyişmək istəyirəm"

Qalan müddət itmir: köhnə tarifin qalan dəyəri yeni tarifdə gün kimi əlavə olunur (FR-ABN-11). Ödəniş səhifəsində neçə gün keçiriləcəyi göstərilir.

### 3.7 "Sifariş verə bilmirəm" / "çox sayda sorğu" xətası

İctimai formalarda IP əsaslı limit var (NFR-SEC-10). Eyni xidmətə qısa müddətdə təkrar sifariş limitə düşür. Müştəri 10 dəqiqə gözləməlidir. Limit əsassız maneə yaradırsa, `src/lib/rate-limit.ts` faylında dəyər dəyişdirilir (texniki komanda).

---

## 4. Eskalasiya

| Hal | Kimə |
|---|---|
| Ödəniş aqreqatorundan gələn nəticə uyğunsuzdur, pul çıxılıb amma tarif yoxdur | Texniki + Biznes |
| Kütləvi spam və ya saxta hesab axını | Texniki (limit və moderasiya) |
| Məlumat sızması şübhəsi | Texniki rəhbər + Hüquq — dərhal |
| Hüquqi tələb, məhkəmə sorğusu | Hüquq |
| Sayt açılmır (`/api/health` 503) | Texniki — dərhal |

---

## 5. Danışıq qaydaları

- Şifrəni heç vaxt soruşmayın və heç vaxt deməyin.
- İstifadəçinin şəxsiyyət sənədi nömrəsini tam formada yazışmada göndərməyin (sistemdə maskalanır).
- Bir müştərinin məlumatını başqa satıcıya açmayın.
- Qərarın səbəbini həmişə yazılı şəkildə, jurnalda qalacaq formada qeyd edin.
