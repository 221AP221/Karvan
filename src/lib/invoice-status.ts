import type { InvoiceStatus } from "@/generated/prisma/enums";

// Azərbaycan dilindəki standart adlar; panel seçilmiş dildə `statusLabel()` işlədir
export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Qaralama",
  SENT: "Göndərilib",
  VIEWED: "Baxılıb",
  CLAIMED_PAID: "Müştəri ödədiyini bildirib",
  PAID: "Ödənilib",
  OVERDUE: "Gecikib",
  CANCELLED: "Ləğv edilib",
};

export const STATUS_STYLE: Record<InvoiceStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-yellow-100 text-yellow-800",
  VIEWED: "bg-yellow-100 text-yellow-800",
  CLAIMED_PAID: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

// Cron (M5) gələnə qədər gecikmə oxuma zamanı hesablanır.
export function effectiveStatus(invoice: { status: InvoiceStatus; dueAt: Date | null }): InvoiceStatus {
  if ((invoice.status === "SENT" || invoice.status === "VIEWED") && invoice.dueAt && invoice.dueAt < new Date()) {
    return "OVERDUE";
  }
  return invoice.status;
}

export const OPEN_STATUSES: InvoiceStatus[] = ["SENT", "VIEWED", "CLAIMED_PAID", "OVERDUE"];

type StatusWords = Partial<Record<`st${InvoiceStatus}`, string>>;

/** Faktura statusunun seçilmiş dildəki adı. */
export function statusLabel(status: InvoiceStatus, words?: StatusWords) {
  return words?.[`st${status}`] ?? STATUS_LABEL[status];
}
