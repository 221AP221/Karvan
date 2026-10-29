import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import type { InvoiceStatus } from "@/generated/prisma/enums";
import { effectiveStatus } from "@/lib/invoice-status";
import { formatAzn } from "@/lib/money";

type Row = {
  id: string;
  number: string;
  customerName: string;
  totalQepik: number;
  issuedAt: Date;
  dueAt: Date | null;
  status: InvoiceStatus;
};

export function InvoiceTable({ invoices }: { invoices: Row[] }) {
  if (invoices.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
        Hələ faktura yoxdur.
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <ul className="divide-y divide-gray-100">
        {invoices.map((invoice) => (
          <li key={invoice.id}>
            <Link href={`/dashboard/invoices/${invoice.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
              <span className="min-w-0">
                <span className="block truncate font-medium">{invoice.customerName}</span>
                <span className="font-mono text-xs text-gray-500">
                  {invoice.number} · {invoice.issuedAt.toLocaleDateString("az-AZ")}
                </span>
              </span>
              <span className="flex flex-col items-end gap-1">
                <span className="font-semibold">{formatAzn(invoice.totalQepik)}</span>
                <StatusBadge status={effectiveStatus(invoice)} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
