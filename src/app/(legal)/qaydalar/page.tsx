import type { Metadata } from "next";
import { Bullets, DraftNotice, LegalHeader, Section } from "../ui";

export const metadata: Metadata = {
  title: "İstifadə şərtləri — Karvan",
  description: "Karvan platformasından istifadə şərtləri: hesab, satıcı ilə müştəri arasındakı münasibət, abunəlik, məzmun qaydaları və məsuliyyət bölgüsü.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/qaydalar" },
};

export default function Terms() {
  return (
    <>
      <DraftNotice />
      <LegalHeader
        title="İstifadə şərtləri"
        intro="Bu şərtlər Karvan platformasından (karvan.az) istifadə qaydalarını, tərəflərin hüquq və öhdəliklərini müəyyən edir. Hesab yaradaraq siz bu şərtləri qəbul etmiş sayılırsınız."
      />

      <Section n="1." title="Anlayışlar">
        <Bullets
          items={[
            <><strong>Platforma</strong> — karvan.az ünvanında fəaliyyət göstərən veb xidmət.</>,
            <><strong>Satıcı</strong> — platformada hesab açaraq öz xidmətlərini təqdim edən istifadəçi.</>,
            <><strong>Müştəri</strong> — satıcının səhifəsindən sifariş verən və ya fakturanı açan şəxs; qeydiyyat tələb olunmur.</>,
            <><strong>Faktura</strong> — satıcının müştəriyə göndərdiyi ödəniş sorğusu sənədi.</>,
            <><strong>Abunəlik</strong> — satıcının platformadan istifadə üçün seçdiyi tarif (Pulsuz, Pro, Pro Max).</>,
          ]}
        />
      </Section>

      <Section n="2." title="Platformanın rolu">
        <p>
          Karvan satıcıya öz xidmətlərini təqdim etmək, sifariş qəbul etmək və faktura hazırlamaq üçün texniki alət verir.
          Platforma xidmətin özünün tərəfi deyil: xidmətin icrası, keyfiyyəti, müddəti və qiyməti barədə razılaşma
          birbaşa satıcı ilə müştəri arasındadır.
        </p>
        <p>
          <strong>Ödənişlər platformadan keçmir.</strong> Müştəri məbləği birbaşa satıcının bank kartına və ya hesabına
          köçürür. Karvan nə pul saxlayır, nə köçürür, nə də satışdan komissiya tutur; sistemdə yalnız ödənişin
          vəziyyəti barədə qeyd aparılır.
        </p>
      </Section>

      <Section n="3." title="Hesab">
        <Bullets
          items={[
            "Hesab yalnız 18 yaşı tamam olmuş şəxslər tərəfindən yaradıla bilər.",
            "Qeydiyyatda verilən məlumatlar doğru olmalıdır; şəxsiyyət sənədinin nömrəsi yalnız hesabın təsdiqi üçün saxlanılır və ictimai səhifədə göstərilmir.",
            "Hesabın girişinə, şifrənin gizli saxlanmasına və hesab üzərindən edilən əməliyyatlara görə istifadəçi cavabdehdir.",
            "Bir şəxs bir neçə hesab açaraq pulsuz tarifin limitlərindən yan keçməməlidir.",
            "İstifadəçi istənilən vaxt hesabını parametrlər bölməsindən silə bilər.",
          ]}
        />
      </Section>

      <Section n="4." title="Məzmun qaydaları">
        <p>Satıcı yerləşdirdiyi məzmuna (xidmət adı, təsvir, qiymət, şəkil, portfolio) görə özü cavabdehdir. Platformada aşağıdakılar qadağandır:</p>
        <Bullets
          items={[
            "qanunla qadağan olunmuş mal və xidmətlər, o cümlədən lisenziya tələb edən fəaliyyətin lisenziyasız təklifi;",
            "başqasının adından çıxış etmək, özgə brendini, loqosunu və ya işini öz işi kimi təqdim etmək;",
            "saxta qiymət, mövcud olmayan xidmət və ya aldadıcı təsvir;",
            "təhqiramiz, zorakılıq təbliğ edən və ya 18+ məzmun;",
            "başqa şəxsin şəxsi məlumatının icazəsiz yerləşdirilməsi.",
          ]}
        />
        <p>
          Qaydalara zidd məzmun xəbərdarlıq olmadan gizlədilə, hesab isə səbəb göstərilməklə bloklana bilər.
          Bloklama barədə qərar satıcıya onun hesabında göstərilir.
        </p>
      </Section>

      <Section n="5." title="Sifariş, faktura və ödəniş">
        <Bullets
          items={[
            "Sabit qiymətli xidmətdə sifariş qəbul olunan kimi faktura avtomatik yaranır; “razılaşma ilə” xidmətdə qiyməti satıcı təsdiqləyir.",
            "Faktura rəsmi vergi sənədi deyil — bu, ödəniş sorğusudur. Vergi öhdəlikləri satıcının öz məsuliyyətindədir.",
            "Müştərinin “Ödədim” bildirişi ödənişin faktiki daxil olduğunu təsdiqləmir; son təsdiqi satıcı öz bank hesabını yoxlayaraq verir.",
            "Ödənişlə bağlı mübahisə birbaşa satıcı ilə müştəri arasında həll olunur; platforma tərəf kimi iştirak etmir.",
          ]}
        />
      </Section>

      <Section n="6." title="Abunəlik və ödəniş şərtləri">
        <Bullets
          items={[
            "Tariflər və limitlər platformanın qiymət səhifəsində göstərilir.",
            "Abunəlik aylıq və ya illik seçilir; illik seçimdə 10 ayın qiyməti tətbiq olunur.",
            "Ödəniş bank kartı (lisenziyalı ödəniş təşkilatı vasitəsilə) və ya bank köçürməsi ilə aparılır. Kart məlumatları Karvan serverlərində saxlanılmır.",
            "Abunəlik avtomatik yenilənmir: müddət bitdikdə tarif Pulsuza qayıdır, məlumatlar silinmir.",
            "Eyni tarif uzadıldıqda yeni müddət mövcud müddətin üzərinə əlavə olunur; tarif dəyişdikdə köhnə tarifin qalan dəyəri yeni tarifdə gün kimi hesaba alınır.",
            "İstifadə olunmuş dövr üçün ödəniş geri qaytarılmır; texniki səbəbdən xidmətin göstərilmədiyi hallara ayrıca baxılır.",
          ]}
        />
      </Section>

      <Section n="7." title="Platformanın öhdəlikləri və məhdudiyyətlər">
        <p>
          Platforma xidməti “olduğu kimi” təqdim edir və fasiləsiz işləyəcəyinə zəmanət vermir. Planlı texniki işlər
          barədə əvvəlcədən məlumat verilməyə çalışılır.
        </p>
        <p>
          Platforma satıcının müştərisi ilə münasibətindən, xidmətin icrasından, gec və ya natamam ödənişdən,
          həmçinin istifadəçinin öz hesab məlumatlarını üçüncü şəxsə verməsindən yaranan zərərə görə məsuliyyət daşımır.
        </p>
      </Section>

      <Section n="8." title="Şərtlərin dəyişdirilməsi və xitam">
        <p>
          Şərtlər yenilənə bilər; əhəmiyyətli dəyişiklik barədə istifadəçiyə hesabında və ya e-poçtla məlumat verilir.
          Dəyişiklikdən sonra platformadan istifadənin davam etdirilməsi yeni şərtlərin qəbulu deməkdir.
        </p>
        <p>
          Qaydaların kobud pozulması halında hesab dayandırıla və ya ləğv edilə bilər. İstifadəçi öz hesabını
          istənilən vaxt silməklə münasibətə xitam verə bilər.
        </p>
      </Section>

      <Section n="9." title="Tətbiq olunan hüquq və əlaqə">
        <p>
          Bu şərtlərə Azərbaycan Respublikasının qanunvericiliyi tətbiq olunur. Mübahisələr danışıqlar yolu ilə,
          razılıq əldə olunmadıqda isə Azərbaycan Respublikasının müvafiq məhkəmələrində həll edilir.
        </p>
        <p>
          Əlaqə: <a href="mailto:hello@karvan.az" className="underline">hello@karvan.az</a>, *0221, Bakı, Azərbaycan.
        </p>
      </Section>
    </>
  );
}
