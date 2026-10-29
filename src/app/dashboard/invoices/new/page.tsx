import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLAN_LIMITS, startOfMonth } from "@/lib/plans";
import { InvoiceEditor } from "./InvoiceEditor";

export default async function NewInvoice() {
  const profile = await requireProfile();
  const limit = PLAN_LIMITS[profile.user.subscription?.plan ?? "FREE"].invoicesPerMonth;
  const used = await db.invoice.count({ where: { profileId: profile.id, issuedAt: { gte: startOfMonth() } } });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Yeni faktura</h1>
      <p className="mb-6 text-sm text-gray-500">
        {limit === Infinity ? "Limitsiz plan" : `Bu ay: ${used} / ${limit} faktura`}
      </p>
      <InvoiceEditor />
    </div>
  );
}
