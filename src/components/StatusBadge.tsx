import type { InvoiceStatus } from "@/generated/prisma/enums";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/invoice-status";

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
