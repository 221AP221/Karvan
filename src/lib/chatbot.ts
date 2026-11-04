import Anthropic from "@anthropic-ai/sdk";
import { AiError, AiSetupError, type ChatTurn, chatWithOpenAi, explainMissingAi } from "@/lib/ai-provider";
import { getAiConfig } from "@/lib/ai-settings";
import { MONTHLY } from "@/lib/billing";
import { PLAN_LIMITS } from "@/lib/plans";

export type { ChatTurn };

const MODEL = "claude-opus-5-5";
export const MAX_TURNS = 12; // söhbətin yadda saxlanılan hissəsi
export const MAX_MESSAGE = 500;

/**
 * Karvan köməkçisi: saytın ziyarətçiləri və satıcılar üçün sual-cavab.
 *
 * Bilik bazası aşağıda, kodda saxlanılır: model yalnız bu məlumatla cavab verir, qiymət və
 * limitləri uydurmur. Bilmədiyi sualı dəstək kanalına yönləndirir.
 */

const money = (qepik: number) => `${(qepik / 100).toFixed(2).replace(".", ",")} AZN`;

const KNOWLEDGE = `
MƏHSUL
Karvan (karvan.az) — sosial şəbəkədə (Instagram, TikTok, WhatsApp) xidmət satan fiziki şəxslər üçün platforma.
Satıcı karvan.az/<istifadəçi_adı> ünvanında səhifə qurur, linki bio-ya qoyur. Müştəri qeydiyyatsız sifariş verir.

ƏSAS FUNKSİYALAR
- Link-in-bio səhifə: profil, xidmətlər və qiymətlər, portfolio, sosial linklər, "Zəng et" düyməsi.
- Xidmətlər: sabit qiymət və ya "Razılaşma ilə"; valyuta AZN, USD, EUR; müddət və şəkil.
- Sifariş: sabit qiymətli xidmətdə faktura dərhal yaranır; "razılaşma ilə" xidmətdə satıcı qiyməti təsdiqləyir.
- Faktura: nömrələnmiş PDF, QR kod, rekvizitlər, WhatsApp ilə paylaşma. Faktura rəsmi vergi sənədi deyil, ödəniş sorğusudur.
- Ödəniş izləmə: müştəri "Ödədim" bildirir, satıcı bankını yoxlayıb təsdiqləyir. Pul platformadan keçmir, birbaşa satıcıya gedir. Satışdan komissiya alınmır.
- Analitika: gəlir, sifariş sayı, ödənilmə nisbəti, ziyarətçi və trafik mənbələri, xidmətlərin performansı.
- AI köməkçi (satıcı üçün): mətndən faktura, xidmət təsviri, brend rəngi, ödəniş xatırlatması.
- Xidmətlər kataloqu: karvan.az/xidmetler — satıcı yeni müştəri tapır; parametrlərdən gizlədilə bilər.
- Dillər: Azərbaycan, türk, rus, ingilis. Qaranlıq rejim var.

TARİFLƏR (aylıq, illik ödənişdə 10 ayın qiyməti — 2 ay pulsuz)
- Pulsuz: ayda ${PLAN_LIMITS.FREE.invoicesPerMonth} faktura, ${PLAN_LIMITS.FREE.services} xidmət, ayda ${PLAN_LIMITS.FREE.aiRequestsPerMonth} AI sorğusu, səhifədə "Karvan ilə yaradılıb" yazısı.
- Pro — ${money(MONTHLY.PRO)}/ay: ayda ${PLAN_LIMITS.PRO.invoicesPerMonth} faktura, ${PLAN_LIMITS.PRO.services} xidmət, ${PLAN_LIMITS.PRO.aiRequestsPerMonth} AI sorğusu, təsdiqlənmiş nişan, platforma yazısı yoxdur.
- Pro Max — ${money(MONTHLY.PRO_MAX)}/ay: limitsiz faktura və xidmət, ${PLAN_LIMITS.PRO_MAX.aiRequestsPerMonth} AI sorğusu, kataloqda önə çıxma, CSV hesabat.
Abunəlik avtomatik yenilənmir: müddət bitəndə tarif Pulsuza qayıdır, məlumatlar qalır. Tarif dəyişəndə köhnə tarifin qalan müddəti itmir.
Ödəniş üsulları: bank kartı (ödəniş təşkilatının səhifəsində) və bank köçürməsi (KRV-XXXXXX kodu ilə). Kart məlumatı Karvanda saxlanılmır.
Endirim kodu varsa, ödəniş səhifəsində "Endirim kodu" sahəsinə yazılır, qiymət avtomatik yenilənir.

HESAB
Qeydiyyat 2 addımdır: şəxsi məlumat (ad, telefon, vətəndaşlıq, FİN/pasport), sonra səhifə ünvanı, e-poçt və şifrə.
İstifadə şərtləri qəbul edilməlidir. Şifrə bərpası e-poçt linki ilə. Şifrəni heç kim, admin də daxil, görə bilmir.
Parametrlərdə "passiv hesabın avtomatik silinməsi" var (defolt 90 gün); silinmədən 14 gün əvvəl xəbərdarlıq gedir, hesaba giriş sayğacı sıfırlayır.

HÜQUQİ
İstifadə şərtləri: karvan.az/qaydalar · Məxfilik: karvan.az/mexfilik · Cookie: karvan.az/cookie
Əlaqə: hello@karvan.az, *0221, Bakı.

HƏLƏ YOXDUR (soruşulsa, düzgün de)
Müştərinin fakturanı kartla onlayn ödəməsi, avtomatik e-poçt/SMS bildirişləri, kataloqda rəy sistemi, komanda üzvləri, VÖEN/e-qaimə.
`;

const RULES = `
Sən Karvanın köməkçisisən. Qaydalar:
1. Yalnız yuxarıdakı məlumat əsasında cavab ver. Məlumat yoxdursa, uydurma: "Bunu dəqiq bilmirəm" de və hello@karvan.az / *0221 ünvanına yönləndir.
2. Qiymət, limit və şərtləri olduğu kimi göstər, dəyişdirmə.
3. Qısa cavab ver: 1-3 cümlə, lazım olanda qısa siyahı. Markdown başlıqları istifadə etmə.
4. Karvanla əlaqəsi olmayan suallara (kod yazmaq, tərcümə, ümumi məsləhət) nəzakətlə imtina et və məhsula qaytar.
5. Heç vaxt şifrə, kart məlumatı və ya şəxsi sənəd nömrəsi soruşma. İstifadəçi belə məlumat yazsa, yazmamağı xahiş et.
6. Konkret hesabla bağlı əməliyyat (ödənişin yoxlanması, hesabın silinməsi) edə bilmirsən — istifadəçini panelə və ya dəstəyə yönləndir.
7. Cavabı istifadəçinin yazdığı dildə ver.
`;

export const CHAT_UNAVAILABLE = "AI köməkçi hazırda əlçatan deyil. Sualınızı hello@karvan.az ünvanına yazın və ya *0221 nömrəsinə zəng edin.";

export async function answer(turns: ChatTurn[], context?: { role: "visitor" | "seller"; plan?: string }): Promise<string> {
  const config = await getAiConfig();
  if (!config) throw new AiSetupError(explainMissingAi());

  const who =
    context?.role === "seller"
      ? `İstifadəçi Karvanda hesabı olan satıcıdır${context.plan ? ` (tarif: ${context.plan})` : ""}.`
      : "İstifadəçi saytın ziyarətçisidir, hələ hesabı olmaya bilər.";
  const system = `${RULES}\n${who}\n\nBİLİK BAZASI:${KNOWLEDGE}`;

  if (config.kind === "openai") return chatWithOpenAi(config, system, turns);

  const response = await new Anthropic().messages.create({
    model: MODEL,
    max_tokens: 600,
    system,
    messages: turns.map((t) => ({ role: t.role, content: t.content })),
  });
  const text = response.content.find((c) => c.type === "text");
  if (!text || text.type !== "text") throw new AiError("AI cavab qaytarmadı.");
  return text.text.trim();
}
