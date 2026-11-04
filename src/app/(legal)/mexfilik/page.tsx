import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, DataTable, DraftNotice, LegalHeader, Section } from "../ui";

export const metadata: Metadata = {
  title: "Məxfilik siyasəti — Karvan",
  description: "Karvan hansı məlumatları toplayır, nə üçün işləyir, nə qədər saxlayır və istifadəçinin hansı hüquqları var.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/mexfilik" },
};

export default function Privacy() {
  return (
    <>
      <DraftNotice />
      <LegalHeader
        title="Məxfilik siyasəti"
        intro="Bu sənəd Karvanın hansı məlumatları topladığını, bu məlumatların nə üçün istifadə olunduğunu, nə qədər saxlandığını və istifadəçinin hansı hüquqlara malik olduğunu izah edir."
      />

      <Section n="1." title="Məlumatın sahibi">
        <p>
          Məlumatların işlənməsinə görə cavabdeh tərəf Karvan platformasının operatorudur (Bakı, Azərbaycan).
          Əlaqə: <a href="mailto:hello@karvan.az" className="underline">hello@karvan.az</a>, *0221.
        </p>
      </Section>

      <Section n="2." title="Toplanan məlumatlar">
        <DataTable
          head={["Kateqoriya", "Nə toplanır", "Mənbə"]}
          rows={[
            ["Hesab məlumatı", "ad, soyad, brend adı, e-poçt, telefon, vətəndaşlıq, FİN/pasport nömrəsi", "satıcı qeydiyyatda verir"],
            ["Profil məzmunu", "səhifə ünvanı, peşə, şəhər, bio, şəkillər, sosial linklər, portfolio", "satıcı özü daxil edir"],
            ["Biznes məlumatı", "xidmətlər, qiymətlər, sifarişlər, fakturalar, ödəniş qeydləri, bank rekvizitləri", "satıcının fəaliyyəti"],
            ["Müştəri məlumatı", "ad, telefon, e-poçt (könüllü), sifariş qeydi", "müştəri sifariş formasında verir"],
            ["Texniki məlumat", "IP ünvan, brauzer növü, cihaz tipi, fəaliyyət jurnalı qeydləri", "avtomatik toplanır"],
            ["Analitika", "anonim ziyarətçi identifikatoru, baxış və klik hadisələri, trafik mənbəyi", "cookie / lokal yaddaş"],
          ]}
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Kart məlumatları (nömrə, CVV, son istifadə tarixi) heç bir halda toplanmır və Karvan serverlərinə daxil olmur —
          kart ödənişi lisenziyalı ödəniş təşkilatının öz səhifəsində aparılır.
        </p>
      </Section>

      <Section n="3." title="İstifadə məqsədləri">
        <Bullets
          items={[
            "hesabın yaradılması, girişin təmin edilməsi və hesabın qorunması;",
            "satıcı səhifəsinin, sifariş və faktura funksiyalarının işləməsi;",
            "abunəlik ödənişlərinin qəbulu və tarifin aktivləşdirilməsi;",
            "satıcıya öz satış göstəricilərini anonim formada göstərmək;",
            "sui-istifadə, spam və saxta məzmunun aşkarlanması, moderasiya;",
            "dəstək müraciətlərinin həlli və qanuni tələblərin yerinə yetirilməsi.",
          ]}
        />
        <p>Məlumatlar reklam məqsədilə üçüncü şəxslərə satılmır və ötürülmür.</p>
      </Section>

      <Section n="4." title="Müştəri məlumatı kimə görünür">
        <p>
          Müştərinin sifariş formasında yazdığı ad və telefon yalnız sifarişin ünvanlandığı satıcıya görünür.
          Başqa satıcı bu məlumatı görə bilmir. Satıcı bu məlumatı yalnız həmin sifarişlə bağlı istifadə etməlidir;
          onun bu öhdəliyə əməl etməməsi satıcının öz məsuliyyətindədir.
        </p>
      </Section>

      <Section n="5." title="Paylaşılan tərəflər">
        <DataTable
          head={["Tərəf", "Nə üçün", "Nə ötürülür"]}
          rows={[
            ["Ödəniş təşkilatı (Epoint / Payriff)", "abunəlik ödənişinin qəbulu", "ödəniş məbləği və kodu; kart məlumatı birbaşa onlara verilir"],
            ["AI təminatçısı", "mətn təklifləri (faktura, təsvir, xatırlatma)", "yalnız satıcının göndərdiyi mətn; hesab məlumatı ötürülmür"],
            ["E-poçt provayderi", "şifrə bərpası və bildiriş məktubları", "e-poçt ünvanı və məktubun məzmunu"],
            ["Hostinq provayderi", "platformanın işləməsi", "texniki jurnal qeydləri"],
          ]}
        />
      </Section>

      <Section n="6." title="Saxlanma müddətləri">
        <DataTable
          head={["Məlumat", "Saxlanma müddəti"]}
          rows={[
            ["Hesab və profil", "hesab aktiv olduğu müddətdə"],
            ["Sifariş və fakturalar", "hesab silinənə qədər"],
            ["Müştəri əlaqə məlumatı", "aid olduğu sifarişlə eyni müddətdə"],
            ["Analitika hadisələri", "24 ay"],
            ["Fəaliyyət və admin jurnalı", "24 ay"],
            ["Ödəniş qeydləri", "maliyyə uçotu tələbinə uyğun olaraq 5 ilədək"],
          ]}
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">Müddətlər hüquqi rəylə dəqiqləşdirilir (BRD §16.4).</p>
      </Section>

      <Section n="7." title="Hesabın silinməsi">
        <p>
          Hesab silindikdə profil, xidmətlər, sifarişlər, fakturalar və yüklənmiş şəkillər silinir.
          Fəaliyyət jurnalının qeydləri (əməliyyatın vaxtı və e-poçt) sui-istifadənin araşdırılması və
          qanuni tələblər üçün saxlanıla bilər.
        </p>
      </Section>

      <Section n="8." title="Təhlükəsizlik">
        <Bullets
          items={[
            "şifrələr geri açılmayan formada (scrypt) saxlanılır — heç bir əməkdaş şifrəni görə bilmir;",
            "sessiya identifikatorları bazada açıq saxlanılmır;",
            "fakturanın ictimai ünvanı təxmin edilə bilməyən identifikatordan ibarətdir;",
            "şəxsiyyət sənədinin nömrəsi interfeysdə maskalanır və ixrac fayllarına düşmür;",
            "ictimai formalar IP əsaslı sürət limiti ilə qorunur;",
            "xarici xidmət açarları şifrələnmiş saxlanılır.",
          ]}
        />
      </Section>

      <Section n="9." title="İstifadəçinin hüquqları">
        <Bullets
          items={[
            "məlumatlarına baxmaq və onların surətini almaq;",
            "yanlış məlumatın düzəldilməsini tələb etmək;",
            "hesabı və məlumatları silmək;",
            "məlumatların işlənməsinə dair etiraz bildirmək və şikayət etmək.",
          ]}
        />
        <p>
          Müraciət üçün: <a href="mailto:hello@karvan.az" className="underline">hello@karvan.az</a>. Cavab 30 gün
          ərzində verilir.
        </p>
      </Section>

      <Section n="10." title="Cookie">
        <p>
          Platformada istifadə olunan cookie və lokal yaddaş qeydləri ayrıca{" "}
          <Link href="/cookie" className="underline">Cookie siyasəti</Link> səhifəsində izah olunur.
        </p>
      </Section>
    </>
  );
}
