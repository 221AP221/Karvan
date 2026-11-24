-- Beh (ilkin ödəniş) mexanizmi — BRD §13.18, FR-BEH-01…05
-- Beh ayrıca faktura deyil: eyni fakturaya bağlı ikinci ödəniş kimi qeydə alınır (FR-BEH-04).

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PaymentKind" AS ENUM ('FULL', 'DEPOSIT', 'BALANCE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable: xidmət səviyyəsində beh faizi və ləğv pəncərəsi (FR-BEH-01/02/05)
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "depositPercent" INTEGER;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "cancelWindowHours" INTEGER NOT NULL DEFAULT 24;

-- AlterTable: fakturada tələb olunan beh və ləğv pəncərəsinin surəti (FR-BEH-03)
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "depositQepik" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "cancelWindowHours" INTEGER;

-- AlterTable: ödənişin növü (beh / qalıq / tam)
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "kind" "PaymentKind" NOT NULL DEFAULT 'FULL';
