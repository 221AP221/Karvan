import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AiError,
  draftPaymentReminder,
  generateServiceDescriptions,
  parseInvoiceText,
  suggestTheme,
} from "@/lib/ai";
import { getCurrentProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoiceUrl } from "@/lib/invoices";
import { formatAzn } from "@/lib/money";

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

// TODO(M4): plan üzrə aylıq AI limiti (PLAN_LIMITS.aiRequestsPerMonth)
export async function POST(request: Request, { params }: { params: Promise<{ task: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Daxil olun" }, { status: 401 });

  const task = (await params).task;
  if (!(task in inputs)) return NextResponse.json({ error: "Naməlum əməliyyat" }, { status: 404 });

  const body = await request.json().catch(() => null);

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
          amount: formatAzn(invoice.totalQepik),
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
    if (error instanceof AiError) return NextResponse.json({ error: error.message }, { status: 422 });
    throw error;
  }
}
