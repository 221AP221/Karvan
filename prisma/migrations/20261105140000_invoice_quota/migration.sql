-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "invoiceQuotaMonth" TIMESTAMP(3),
ADD COLUMN     "invoiceQuotaUsed" INTEGER NOT NULL DEFAULT 0;


-- Mövcud profillər: bu ayın artıq yaradılmış fakturaları sayğaca köçürülür
UPDATE "Profile" p
SET "invoiceQuotaMonth" = date_trunc('month', now()),
    "invoiceQuotaUsed" = (SELECT count(*) FROM "Invoice" i WHERE i."profileId" = p.id AND i."issuedAt" >= date_trunc('month', now()));
