import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AiError,
  AiNotConfiguredError,
  AiSetupError,
  draftPaymentReminder,
  generateServiceDescriptions,
  parseInvoiceText,
  suggestTheme,
} from "@/lib/ai";
import { logActivity } from "@/lib/activity";
import { getAiConfig } from "@/lib/ai-settings";
import { getCurrentProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoiceUrl } from "@/lib/invoices";
import { formatMoney } from "@/lib/money";
import { PLAN_LIMITS, startOfMonth } from "@/lib/plans";
import { LIMITS, rateLimit, tooMany } from "@/lib/rate-limit";

const inputs = {
  "parse-invoice": z.object({ text: z.string().min(3).max(2000) }),
  "describe-service": z.object({
    title: z.string().min(2).max(100),
    keywords: z.string().max(300),
    niche: z.string().max(100).optional(),
  }),
  theme: z.object({ bio: z.string().max(500), niche: z.string().max(100) }),
  reminder: z.object({
    invoiceId: z.string(),
    channel: z.enum(["WHATSAPP", "SMS", "EMAIL"]),
    tone: z.enum(["friendly", "neutral", "firm"]).default("friendly"),
  }),
};

export async function POST(request: Request, { params }: { params: Promise<{ task: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Daxil olun" }, { status: 401 });

  const task = (await params).task;
  if (!(task in inputs)) return NextResponse.json({ error: "Naməlum əməliyyat" }, { status: 404 });

  // Aylıq plan limitindən əlavə qısa pəncərəli qoruma: bir hesabın ardıcıl sorğuları
  const burst = rateLimit(`ai:${profile.userId}`, LIMITS.ai.max, LIMITS.ai.windowMs);
  if (!burst.ok) return tooMany(burst, "AI sorğuları çox sıxdır. Bir dəqiqə sonra yenidən yoxlayın.");

  const body = await request.json().catch(() => null);

  // Plan üzrə aylıq AI limiti: pulsuz modellərin kvotasını da qoruyur. AI qoşulmayıbsa, sorğu sayılmır.
  if (await getAiConfig()) {
    const limit = PLAN_LIMITS[profile.user.subscription?.plan ?? "FREE"].aiRequestsPerMonth;
    const used = await db.activityLog.count({ where: { userId: profile.userId, action: "ai_request", createdAt: { gte: startOfMonth() } } });
    if (used >= limit) {
      return NextResponse.json({ error: `Bu ayki AI limiti (${limit} sorğu) bitib. Daha çoxu üçün yuxarı plana keçin.` }, { status: 429 });
    }
    await logActivity({ userId: profile.userId, email: profile.user.email, action: "ai_request", details: task });
  }

  try {
    switch (task) {
      case "parse-invoice": {
        const { text } = inputs["parse-invoice"].parse(body);
        const services = await db.service.findMany({ where: { profileId: profile.id, isActive: true } });
        const result = await parseInvoiceText(text, {
          today: new Date().toISOString().slice(0, 10),
          services: services.map((s) => ({
            title: s.title,
            amountAzn: s.amountQepik === null ? null : s.amountQepik / 100,
          })),
        });
        return NextResponse.json(result);
      }
      case "describe-service":
        return NextResponse.json({ variants: await generateServiceDescriptions(inputs["describe-service"].parse(body)) });
      case "theme":
        return NextResponse.json(await suggestTheme(inputs.theme.parse(body)));
      case "reminder": {
        const { invoiceId, channel, tone } = inputs.reminder.parse(body);
        const invoice = await db.invoice.findFirst({ where: { id: invoiceId, profileId: profile.id } });
        if (!invoice) return NextResponse.json({ error: "Faktura tapılmadı" }, { status: 404 });
        const daysOverdue = invoice.dueAt
          ? Math.floor((Date.now() - invoice.dueAt.getTime()) / 86_400_000)
          : 0;
        const message = await draftPaymentReminder({
          sellerName: profile.displayName,
          customerName: invoice.customerName,
          invoiceNumber: invoice.number,
          amount: formatMoney(invoice.totalQepik, invoice.currency),
          invoiceUrl: invoiceUrl(invoice.publicId),
          daysOverdue,
          channel,
          tone,
        });
        return NextResponse.json({ message });
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Məlumatlar düzgün deyil" }, { status: 400 });
    }
    // Açar ümumiyyətlə yazılmayıbsa, "sonra cəhd edin" demək yanlışdır: heç nə dəyişməyəcək
    if (error instanceof AiNotConfiguredError && profile.user.role === "USER") {
      return NextResponse.json(
        { error: "AI köməkçi hələ qoşulmayıb. Sayt sahibi admin paneldə Parametrlər → AI bölməsində açar yazmalıdır." },
        { status: 503 },
      );
    }
    if (error instanceof AiSetupError && profile.user.role === "USER") {
      return NextResponse.json({ error: "AI köməkçi hazırda əlçatan deyil. Bir az sonra yenidən cəhd edin." }, { status: 503 });
    }
    if (error instanceof AiError) return NextResponse.json({ error: error.message }, { status: 422 });
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "AI hazırda məşğuldur, bir az sonra yenidən cəhd edin." }, { status: 503 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API error", error.status, error.message);
      return NextResponse.json({ error: "AI xidməti cavab vermədi." }, { status: 502 });
    }
    throw error;
  }
}
