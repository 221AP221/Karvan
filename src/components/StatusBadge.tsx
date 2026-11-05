import type { InvoiceStatus } from "@/generated/prisma/enums";
import { STATUS_STYLE, statusLabel } from "@/lib/invoice-status";

export function StatusBadge({ status, words }: { status: InvoiceStatus; words?: Partial<Record<string, string>> }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>
      {statusLabel(status, words)}
    </span>
  );
}
