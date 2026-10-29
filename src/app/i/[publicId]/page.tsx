import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getPublicInvoice } from "@/lib/invoices";
import { formatAzn } from "@/lib/money";
import { ClaimPaidButton, CopyValue } from "./ClaimPaidButton";

const STATUS_LABEL = {
  DRAFT: "Qaralama",
  SENT: "Ödəniş gözlənilir",
  VIEWED: "Ödəniş gözlənilir",
  CLAIMED_PAID: "Satıcının təsdiqi gözlənilir",
  PAID: "Ödənilib",
  OVERDUE: "Gecikib",
  CANCELLED: "Ləğv edilib",
} as const;

export default async function InvoicePage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const invoice = await getPublicInvoice(publicId);
  if (!invoice || invoice.status === "DRAFT") notFound();

  if (invoice.status === "SENT") {
    await db.invoice.update({ where: { id: invoice.id }, data: { status: "VIEWED" } });
  }

  const { profile } = invoice;
  const payable = ["SENT", "VIEWED", "OVERDUE"].includes(invoice.status);

  return (
    <main
      className="mx-auto max-w-md px-4 py-10"
      style={{ "--brand": (profile.theme as { primary?: string } | null)?.primary } as React.CSSProperties}
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">{profile.displayName}</p>
        <h1 className="text-xl font-bold">Faktura № {invoice.number}</h1>
        <p className="mt-1 inline-block rounded-full bg-gray-100 px-3 py-1 text-sm">{STATUS_LABEL[invoice.status]}</p>
        {invoice.dueAt && payable && (
          <p className="mt-2 text-sm text-gray-500">Son ödəniş: {invoice.dueAt.toLocaleDateString("az-AZ")}</p>
        )}

        <ul className="mt-6 divide-y divide-gray-100">
          {invoice.items.map((item) => (
            <li key={item.id} className="flex justify-between py-2">
              <span>
                {item.title} × {item.quantity}
              </span>
              <span>{formatAzn(item.quantity * item.unitQepik)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between text-lg font-semibold">
          <span>Ümumi</span>
          <span>{formatAzn(invoice.totalQepik)}</span>
        </p>

        {payable && invoice.paymentMethod !== "ONLINE" && (
          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm">
            <p className="font-medium">Ödəniş rekvizitləri</p>
            {profile.accountName && <p>Alıcı: {profile.accountName}</p>}
            {profile.bankName && <p>Bank: {profile.bankName}</p>}
            {profile.cardNumber && <CopyValue label="Kart" value={profile.cardNumber} />}
            {profile.iban && <CopyValue label="IBAN" value={profile.iban} />}
            <ClaimPaidButton publicId={invoice.publicId} />
          </div>
        )}
        {/* TODO(M5): ONLINE / BOTH üçün gateway düyməsi */}

        <a
          href={`/api/invoices/${invoice.publicId}/pdf`}
          className="mt-6 block rounded-full border border-gray-300 py-2 text-center font-medium"
        >
          PDF yüklə
        </a>
      </div>
      <p className="mt-4 text-center text-xs text-gray-400">Ödəniş sorğusudur, rəsmi vergi sənədi deyil.</p>
    </main>
  );
}
