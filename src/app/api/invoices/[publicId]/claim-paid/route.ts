import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Müştəri "Ödədim" basır; status satıcı təsdiqləyənə qədər CLAIMED_PAID qalır.
export async function POST(_: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { count } = await db.invoice.updateMany({
    where: { publicId: (await params).publicId, status: { in: ["SENT", "VIEWED", "OVERDUE"] } },
    data: { status: "CLAIMED_PAID" },
  });
  if (count === 0) return NextResponse.json({ error: "Bu faktura üçün əməliyyat mümkün deyil" }, { status: 409 });
  // TODO(M2): satıcıya bildiriş, qəbz şəklinin yüklənməsi
  return NextResponse.json({ ok: true });
}
