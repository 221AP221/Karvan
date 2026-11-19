import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, LegalHeader, Section } from "../ui";

export const metadata: Metadata = {
  title: "Cookie siyasəti — Karvan",
  description: "Karvan hansı cookie və lokal yaddaş qeydlərindən istifadə edir, hər biri nə üçündür və necə söndürülür.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/cookie" },
};

export default function Cookies() {
  return (
    <>
      <LegalHeader
        title="Cookie siyasəti"
        intro="Cookie — brauzerinizdə saxlanılan kiçik qeyddir. Karvan yalnız platformanın işləməsi və satıcıya anonim statistika göstərmək üçün lazım olan qeydlərdən istifadə edir; reklam izləyicisi yoxdur."
      />

      <Section n="1." title="İstifadə olunan qeydlər">
        <DataTable
          head={["Ad", "Növ", "Nə üçün", "Müddət"]}
          rows={[
            ["sid", "Zəruri", "hesaba girişin saxlanması", "30 gün"],
            ["lang", "Zəruri", "seçilmiş dilin yadda saxlanması", "1 il"],
            ["theme", "Zəruri", "işıqlı / qaranlıq rejim seçimi", "1 il"],
            ["cookie-notice", "Zəruri", "bu bildirişin bir daha göstərilməməsi", "1 il"],
            ["kv_visitor", "Analitika", "anonim ziyarətçi identifikatoru: təkrar baxışı yeni baxışdan ayırmaq üçün", "12 ay"],
          ]}
        />
      </Section>

      <Section n="2." title="Analitika necə işləyir">
        <p>
          Satıcı öz səhifəsinin neçə dəfə açıldığını, sifariş formasının neçə dəfə doldurulduğunu və ziyarətçinin
          hansı platformadan gəldiyini görür. Bu statistika <strong>anonimdir</strong>: ad, telefon, e-poçt və ya
          başqa şəxsi məlumat toplanmır, ziyarətçi identifikatoru təsadüfi yaradılır və heç bir hesabla
          əlaqələndirilmir. Botların və satıcının öz baxışları sayılmır.
        </p>
      </Section>

      <Section n="3." title="Üçüncü tərəf izləyiciləri">
        <p>
          Platformada reklam şəbəkələrinin, sosial şəbəkə piksellərinin və ya xarici analitika sistemlərinin
          izləyici kodu yoxdur. Bütün statistika platformanın öz daxilində hesablanır.
        </p>
      </Section>

      <Section n="4." title="Necə söndürmək olar">
        <p>
          Analitika qeydini brauzerin parametrlərindən cookie-ləri bloklayaraq və ya silərək dayandıra bilərsiniz.
          Zəruri qeydlər söndürüldükdə hesaba giriş, dil və rejim seçimi işləməyə bilər.
        </p>
        <p>
          Ətraflı: <Link href="/mexfilik" className="underline">Məxfilik siyasəti</Link>.
        </p>
      </Section>
    </>
  );
}
