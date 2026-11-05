import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { LIMITS, limitByIp, tooMany } from "@/lib/rate-limit";

// Müştəri "Ödədim" basır; status satıcı təsdiqləyənə qədər CLAIMED_PAID qalır.
export async function POST(_: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const limit = await limitByIp("claim-paid", LIMITS.claimPaid.max, LIMITS.claimPaid.windowMs);
  if (!limit.ok) return tooMany(limit);

  const { count } = await db.invoice.updateMany({
    where: { publicId: (await params).publicId, status: { in: ["SENT", "VIEWED", "OVERDUE"] } },
    data: { status: "CLAIMED_PAID" },
  });
  if (count === 0) return NextResponse.json({ error: "Bu faktura üçün əməliyyat mümkün deyil" }, { status: 409 });
  const invoice = await db.invoice.findUnique({
    where: { publicId: (await params).publicId },
    select: { id: true, number: true, customerName: true, profile: { select: { id: true, userId: true, user: { select: { email: true } } } } },
  });
  if (invoice) {
    await logActivity({ userId: invoice.profile.userId, email: invoice.profile.user.email, action: "invoice_claimed", details: `${invoice.number} · ${invoice.customerName}` });
    await notify({
      profileId: invoice.profile.id,
      event: "PAYMENT_CLAIMED",
      title: `Ödəniş bildirişi: ${invoice.number}`,
      body: `${invoice.customerName} ${invoice.number} nömrəli faktura üzrə “Ödədim” düyməsini basdı. Bank hesabınızı yoxlayıb təsdiqləyin.`,
      linkPath: "/dashboard/invoices",
      entityId: invoice.id,
    });
  }
  return NextResponse.json({ ok: true });
}
