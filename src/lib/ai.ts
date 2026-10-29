import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

const MODEL = "claude-opus-5-5";

const client = new Anthropic();

// Bütün AI çıxışları satıcının təsdiqindən keçir, heç biri avtomatik göndərilmir.
async function generate<T extends z.ZodType>(
  schema: T,
  system: string,
  prompt: string,
  effort: "low" | "medium",
): Promise<z.infer<T>> {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    // Təhlükəsizlik klassifikatoru sorğunu rədd etsə, API onu avtomatik başqa modelə yönləndirir.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    messages: [{ role: "user", content: prompt }],
    output_config: { effort, format: betaZodOutputFormat(schema) },
  });

  if (response.stop_reason === "refusal") {
    throw new AiError("AI bu sorğunu emal edə bilmədi.");
  }
  if (!response.parsed_output) {
    throw new AiError("AI cavabı gözlənilən formatda deyil.");
  }
  return response.parsed_output;
}

export class AiError extends Error {}

// AI-1: sərbəst mətndən faktura

export const ParsedInvoiceSchema = z.object({
  customerName: z.string().describe("Müştərinin adı, mətndə yoxdursa boş sətir"),
  customerPhone: z.string().nullable().describe("+994XXXXXXXXX formatında, yoxdursa null"),
  items: z
    .array(
      z.object({
        title: z.string(),
        quantity: z.number().int(),
        unitPriceAzn: z.number().describe("Bir vahidin qiyməti, AZN"),
      }),
    )
    .describe("Faktura sətirləri"),
  dueDate: z.string().nullable().describe("YYYY-MM-DD, mətndə son tarix yoxdursa null"),
  note: z.string().nullable(),
  warnings: z
    .array(z.string())
    .describe("Satıcının yoxlamalı olduğu qeyri-müəyyən məqamlar, Azərbaycan dilində"),
});
export type ParsedInvoice = z.infer<typeof ParsedInvoiceSchema>;

export function parseInvoiceText(
  text: string,
  ctx: { today: string; services: { title: string; amountAzn: number | null }[] },
) {
  const catalog = ctx.services
    .map((s) => `- ${s.title}: ${s.amountAzn === null ? "qiymət razılaşma ilə" : `${s.amountAzn} AZN`}`)
    .join("\n");

  return generate(
    ParsedInvoiceSchema,
    `Sən Azərbaycanda xidmət satan şəxslərin köməkçisisən. Satıcının sərbəst yazdığı mətndən faktura məlumatlarını çıxarırsan.
Bu günün tarixi: ${ctx.today}. "Cümə gününə qədər", "sabah" kimi ifadələri bu tarixə görə hesabla.
Mətndə qiymət yoxdursa, satıcının xidmət kataloqundan götür. Kataloqda da yoxdursa, qiyməti 0 yaz və warnings-ə qeyd et.
"manat", "AZN", "₼" eyni valyutadır. Təxmin etdiyin hər şeyi warnings-ə yaz.

Satıcının xidmət kataloqu:
${catalog || "(boşdur)"}`,
    text,
    "medium",
  );
}

// AI-2: xidmət təsviri

const DescriptionsSchema = z.object({
  variants: z.array(z.string()).describe("3 fərqli variant, hər biri 2-3 cümlə"),
});

export async function generateServiceDescriptions(input: {
  title: string;
  keywords: string;
  niche?: string;
}) {
  const { variants } = await generate(
    DescriptionsSchema,
    `Sən Instagram-da xidmət satanlar üçün qısa satış mətnləri yazırsan. Dil: Azərbaycan dili, səmimi amma peşəkar ton.
Hər variant 2-3 cümlədir, müştəriyə nə qazanacağını deyir. Şişirdilmiş vədlər, emoji yığını və qiymət yazma.`,
    `Xidmət: ${input.title}\nAçar sözlər: ${input.keywords}${input.niche ? `\nSahə: ${input.niche}` : ""}`,
    "low",
  );
  return variants;
}

// AI-3: tema təklifi

const HexColor = z.string().describe("#RRGGBB formatında rəng");

export const ThemeSchema = z.object({
  primary: HexColor,
  background: HexColor,
  text: HexColor,
  font: z.enum(["Inter", "Manrope", "Playfair Display", "Montserrat", "Nunito"]),
  buttonStyle: z.enum(["rounded", "pill", "square"]),
  rationale: z.string().describe("Seçimin qısa izahı, Azərbaycan dilində"),
});
export type Theme = z.infer<typeof ThemeSchema>;

export function suggestTheme(input: { bio: string; niche: string }) {
  return generate(
    ThemeSchema,
    `Sən brend dizaynerisən. Satıcının sahəsinə və bio-suna uyğun link-in-bio səhifə teması təklif edirsən.
Mətn və fon rəngi arasında kontrast ən azı 4.5:1, primary düymə rəngi fonda aydın seçilməlidir.`,
    `Sahə: ${input.niche}\nBio: ${input.bio}`,
    "low",
  );
}

// AI-4: ödəniş xatırlatması

const ReminderSchema = z.object({
  message: z.string(),
});

export async function draftPaymentReminder(input: {
  sellerName: string;
  customerName: string;
  invoiceNumber: string;
  amount: string;
  invoiceUrl: string;
  daysOverdue: number;
  channel: "WHATSAPP" | "SMS" | "EMAIL";
  tone: "friendly" | "neutral" | "firm";
}) {
  const timing =
    input.daysOverdue < 0
      ? `Son ödəniş tarixinə ${-input.daysOverdue} gün qalıb.`
      : input.daysOverdue === 0
        ? "Son ödəniş tarixi bu gündür."
        : `Ödəniş ${input.daysOverdue} gün gecikib.`;
  const tone = { friendly: "isti, dostcasına", neutral: "nəzakətli, işgüzar", firm: "nəzakətli amma qətiyyətli" }[
    input.tone
  ];
  const length = input.channel === "SMS" ? "Ən çox 160 simvol, latın hərfləri ilə." : "Ən çox 4 qısa cümlə.";

  const { message } = await generate(
    ReminderSchema,
    `Sən satıcının adından müştəriyə ödəniş xatırlatması yazırsan. Dil: Azərbaycan dili. Ton: ${tone}.
${length} Faktura linkini mütləq daxil et. Hədə, təhqir və ya ödənilməsə cəza kimi ifadələr işlətmə.`,
    `Satıcı: ${input.sellerName}
Müştəri: ${input.customerName}
Faktura: ${input.invoiceNumber}, məbləğ ${input.amount}
Link: ${input.invoiceUrl}
${timing}`,
    "low",
  );
  return message;
}
