import { getPublicInvoice, invoiceUrl } from "@/lib/invoices";
import { renderInvoicePdf } from "@/lib/pdf/InvoiceDocument";
import { PLAN_LIMITS } from "@/lib/plans";

export async function GET(_: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const invoice = await getPublicInvoice((await params).publicId);
  if (!invoice) return new Response("Tapılmadı", { status: 404 });

  const { profile } = invoice;
  const plan = profile.user.subscription?.plan ?? "FREE";
  const pdf = await renderInvoicePdf({
    number: invoice.number,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt,
    seller: profile,
    customer: { name: invoice.customerName, phone: invoice.customerPhone },
    items: invoice.items,
    totalQepik: invoice.totalQepik,
    note: invoice.note,
    url: invoiceUrl(invoice.publicId),
    primaryColor: (profile.theme as { primary?: string } | null)?.primary ?? "#6d28d9",
    showBranding: PLAN_LIMITS[plan].branding,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
    },
  });
}
