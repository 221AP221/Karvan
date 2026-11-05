import { requirePageAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/lib/plans";
import { invoicesUsedThisMonth } from "@/lib/invoices";
import { InvoiceEditor } from "./InvoiceEditor";

export default async function NewInvoice() {
  const profile = await requirePageAccess("invoices");
  const limit = PLAN_LIMITS[profile.user.subscription?.plan ?? "FREE"].invoicesPerMonth;
  const used = await invoicesUsedThisMonth(profile.id);
  // Faktura sətrində xidmət siyahıdan seçilə bilsin (qiymət avtomatik düşsün) və ya əllə yazılsın
  const services = await db.service.findMany({
    where: { profileId: profile.id, isActive: true, blocked: false },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, amountQepik: true, currency: true, priceType: true },
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Yeni faktura</h1>
      <p className="mb-6 text-sm text-gray-500">
        {limit === Infinity ? "Limitsiz plan" : `Bu ay: ${used} / ${limit} faktura`}
      </p>
      <InvoiceEditor
        services={services.map((s) => ({
          id: s.id,
          title: s.title,
          currency: s.currency,
          unitPrice: s.priceType === "FIXED" && s.amountQepik !== null ? (s.amountQepik / 100).toFixed(2) : "",
        }))}
      />
    </div>
  );
}
