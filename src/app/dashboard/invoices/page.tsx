import Link from "next/link";
import { InvoiceTable } from "@/components/InvoiceTable";
import { buttonClass } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function Invoices() {
  const profile = await requireProfile();
  const invoices = await db.invoice.findMany({
    where: { profileId: profile.id },
    orderBy: { issuedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fakturalar</h1>
        <Link href="/dashboard/invoices/new" className={buttonClass}>+ Yeni faktura</Link>
      </div>
      <InvoiceTable invoices={invoices} />
    </div>
  );
}
