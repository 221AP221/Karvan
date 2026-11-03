# -*- coding: utf-8 -*-
from dg import D, BRAND, GREY, GHOST, MUTED, INK

# ---------- 3.1 Cari proses (as-is)
d = D(1500, 1060, "Cari proses (as-is)", "Sifarişin beş ayrı kanalda keçdiyi mövcud yol və hər addımın ağrı nöqtəsi (§3.1)")
steps = [
    ("Müştəri profilə baxır", "Instagram / TikTok"),
    ("DM: “Qiymət nə qədərdir?”", "hər müştəri ayrıca soruşur"),
    ("Satıcı əl ilə cavablayır", "eyni mətn gündə onlarla dəfə"),
    ("Razılaşma", "səsli mesaj / yazışma"),
    ("Rekvizit DM-də göndərilir", "kart nömrəsi əl ilə yazılır"),
    ("Müştəri köçürür", "bank tətbiqi"),
    ("Ekran şəkli göndərilir", "ödənişin yeganə “sübutu”"),
    ("Satıcı bankı yoxlayır", "əl ilə tutuşdurma"),
    ("Dəftərə / yaddaşa qeyd", "bəzən heç qeyd olunmur"),
]
pains = {1: "P1 · təkrar əmək", 2: "P1 · sorğuların ≈20%-i cavabsız qalır",
         4: "P2 · səhv rəqəm riski", 6: "P2 · “göndərdim / gəlməyib” mübahisəsi",
         8: "P3 · vahid uçot mənbəyi yoxdur"}
y = 140
for i, (t, s) in enumerate(steps):
    d.box(380, y, 520, 68, t, s, kind="n", ts=17, ss=13)
    if i in pains:
        d.label(930, y + 40, pains[i], size=14, color="#92540A")
        d.arrow([(900, y + 34), (924, y + 34)], color=GREY)
    if i < len(steps) - 1:
        d.arrow([(640, y + 68), (640, y + 88)])
    y += 88
d.box(380, y + 6, 520, 72, "Ayın sonu: kim ödəyib, kim qalıb?", "cavab yaddaşda və yazışma arxivində axtarılır", kind="warn", ts=17, ss=13)
d.arrow([(640, y - 20), (640, y + 6)])
d.label(60, 150, "Addım", size=14, color=MUTED, weight="700")
d.label(930, 150, "Ağrı nöqtəsi", size=14, color=MUTED, weight="700")
d.save("d-3-1.svg")

# ---------- 4.1 Hədəf proses (to-be)
d = D(1560, 900, "Hədəf proses (to-be)", "Karvanda sifarişin vahid axını: kəşfdən ödənişin uçotuna qədər (§4.1)")
d.box(80, 150, 300, 86, "Müştəri", "bio link · kataloq · axtarış", kind="n")
d.box(80, 300, 300, 86, "Satıcı səhifəsi", "xidmətlər və qiymətlər açıq", kind="brand")
d.arrow([(230, 236), (230, 300)])
d.arrow([(380, 343), (470, 343)])
d.diamond(620, 343, 240, 130, "Qiymət növü?", "xidmətin ayarı")
d.box(820, 170, 330, 86, "Sabit qiymət", "faktura DƏRHAL yaranır", kind="ok")
d.box(820, 430, 330, 86, "Razılaşma ilə", "sorğu satıcıya düşür", kind="w")
d.arrow([(620, 278), (620, 213), (810, 213)])
d.arrow([(620, 408), (620, 473), (810, 473)])
d.box(820, 560, 330, 72, "Satıcı qiyməti yazır", kind="w", ts=17)
d.arrow([(985, 516), (985, 560)])
d.box(1210, 300, 280, 86, "Faktura", "nömrə · PDF · QR", kind="brand")
d.arrow([(1150, 213), (1350, 213), (1350, 300)])
d.arrow([(1150, 596), (1180, 596), (1180, 343), (1210, 343)])
d.box(1210, 470, 280, 72, "Rekvizit + QR", "kopyala və ödə", ts=17, ss=13)
d.arrow([(1350, 386), (1350, 470)])
d.box(1210, 620, 280, 72, "Müştəri “Ödədim”", "CLAIMED_PAID", ts=17, ss=13)
d.arrow([(1350, 542), (1350, 620)])
d.box(820, 700, 330, 80, "Satıcı təsdiqləyir", "status → PAID", kind="ok", ts=17, ss=13)
d.arrow([(1210, 656), (1150, 656), (1150, 700)])
d.box(380, 700, 330, 80, "Analitika və hesabat", "gəlir · konversiya · mənbə", kind="brand", ts=17, ss=13)
d.arrow([(820, 740), (710, 740)])
d.legend(80, 700, [("box", "sistemin yaratdığı sənəd"), ("solid", "axın")], w=260)
d.save("d-4-1.svg")

# ---------- 8.2 Güc / maraq matrisi
d = D(1240, 880, "Paydaşların güc / maraq matrisi", "Hər paydaş üçün əlaqə strategiyası (§8.2)")
x0, y0, cw, ch = 220, 160, 440, 290
cells = [
    (0, 0, "Qane et / izlə", ["PD-06 Ödəniş aqreqatoru", "PD-09 Hüquq məsləhətçisi", "PD-11 Tənzimləyici"], "#FFF7ED", "#D9962B"),
    (1, 0, "Yaxından idarə et", ["PD-01 Sponsor", "PD-05 Texniki komanda"], "#FFF5FA", BRAND),
    (0, 1, "Müşahidə et", ["PD-03 Müştəri", "PD-10 Axtarış sistemləri"], "#FAFBFC", "#C9CDD4"),
    (1, 1, "Məlumatlandır", ["PD-02 Satıcı", "PD-04 Dəstək", "PD-07 AI təminatçısı", "PD-08 E-poçt provayderi"], "#F2FBF5", "#58A86B"),
]
for cx, cy, title, items, fill, stroke in cells:
    X, Y = x0 + cx * cw, y0 + cy * ch
    d.p.append(f'<rect x="{X}" y="{Y}" width="{cw}" height="{ch}" rx="12" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')
    d.label(X + 24, Y + 40, title, size=18, color=INK, weight="700")
    d.lines(X + 24, Y + 76, items, size=15, lh=28)
d.label(x0 + cw, 130, "Maraq →", size=15, color=MUTED, anchor="middle")
d.label(x0 + cw / 2, 130, "aşağı", size=14, color=MUTED, anchor="middle")
d.label(x0 + cw * 1.5, 130, "yüksək", size=14, color=MUTED, anchor="middle")
d.p.append(f'<text x="150" y="{y0+ch/2}" font-size="14" fill="{MUTED}" text-anchor="middle" transform="rotate(-90 150 {y0+ch/2})">yüksək</text>')
d.p.append(f'<text x="150" y="{y0+ch*1.5}" font-size="14" fill="{MUTED}" text-anchor="middle" transform="rotate(-90 150 {y0+ch*1.5})">aşağı</text>')
d.p.append(f'<text x="112" y="{y0+ch}" font-size="15" fill="{MUTED}" text-anchor="middle" transform="rotate(-90 112 {y0+ch})">↑ Təsir</text>')
d.label(x0, 800, "Strategiya paydaşın təsiri (qərarı dəyişə bilmə gücü) və marağının (nəticədən asılılığının) kəsişməsindən çıxır.", size=15, color=MUTED)
d.save("d-8-2.svg")

# ---------- 10.1 Tələb səviyyələri
d = D(1420, 760, "Tələblərin arxitekturası", "Hər səviyyə bir yuxarıdakını əsaslandırır; aşağıdan yuxarı izlənilənlik §24-dədir (§10.1)")
rows = [
    ("BG", "Biznes məqsədi", "niyə — təşkilat nəyə nail olmaq istəyir", BRAND, "brand"),
    ("BR", "Biznes tələbi", "təşkilat səviyyəsində nə tələb olunur", INK, "n"),
    ("SH", "Paydaş tələbi", "rol nə edə bilməlidir", INK, "n"),
    ("FR / NFR / DR / IR", "Həll tələbi", "sistem nə etməlidir", INK, "n"),
    ("UAT", "Qəbul meyarı", "necə yoxlanılır", "#246B38", "ok"),
]
y = 150
for i, (code, title, sub, color, kind) in enumerate(rows):
    x = 150 + i * 36
    w = 1060 - i * 36
    d.box(x, y, w, 86, "", None, kind=kind)
    d.label(x + 28, y + 38, code, size=19, color=color, weight="700")
    d.label(x + 28, y + 64, title, size=16, color=INK)
    d.label(x + w - 28, y + 52, sub, size=15, color=MUTED, anchor="end")
    if i < len(rows) - 1:
        d.arrow([(x + 60, y + 86), (x + 60, y + 116)])
    y += 116
d.label(150, 720, "Bağlantısı olmayan tələb əhatədən kənar sayılır: hər həll tələbi ən azı bir paydaş tələbinə, hər paydaş tələbi ən azı bir biznes tələbinə bağlıdır.", size=15, color=MUTED)
d.save("d-10-1.svg")

# ---------- 28.2 Dəyişiklik prosesi
d = D(1400, 820, "Dəyişikliklərin idarə olunması", "Baseline-dan sonra hər dəyişiklik bu yoldan keçir (§28.2)")
d.box(540, 140, 320, 76, "Dəyişiklik ehtiyacı", "istənilən paydaş", ts=17, ss=13)
d.box(500, 260, 400, 86, "CR qeydiyyatı", "təşəbbüskar · səbəb · təklif", kind="w", ts=17, ss=13)
d.arrow([(700, 216), (700, 260)])
d.box(460, 390, 480, 96, "BA təsir təhlili", "əhatə · tələblər · risk · UAT · qrafik · xərc", kind="brand", ts=17, ss=13)
d.arrow([(700, 346), (700, 390)])
d.diamond(700, 580, 300, 140, "Təsir səviyyəsi?", "§28.3 meyarları")
d.arrow([(700, 486), (700, 510)])
d.box(120, 540, 320, 86, "Aşağı / orta", "BA (+ texniki) təsdiqi", kind="ok", ts=17, ss=13)
d.arrow([(550, 580), (440, 580)])
d.box(960, 540, 320, 86, "Yüksək", "sponsor qərarı", kind="warn", ts=17, ss=13)
d.arrow([(850, 580), (960, 580)])
d.box(960, 670, 320, 76, "qəbul · rədd · təxirə", kind="w", ts=16)
d.arrow([(1120, 626), (1120, 670)])
d.box(390, 690, 520, 86, "Baseline yenilənir", "versiya +0.1 · §24 izlənilənlik matrisi", kind="brand", ts=17, ss=13)
d.arrow([(280, 626), (280, 733), (390, 733)])
d.arrow([(960, 708), (909, 708), (909, 733)])
d.save("d-28-2.svg")
print("ok")
