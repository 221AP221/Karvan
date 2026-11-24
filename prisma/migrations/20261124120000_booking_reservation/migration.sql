-- Rezervasiya və təqvim (BRD §13.17, FR-REZ-01…11)
-- IF NOT EXISTS / DO bloku: lokal bazada (tək bağlantı) miqrasiya yarımçıq kəsilib yenidən
-- işlədiləndə "already exists" xətası ilə dayanmasın deyə.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ServiceLocation" AS ENUM ('SELLER', 'CUSTOMER', 'ONLINE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable: ustanın iş saatları və buferi (FR-REZ-01, FR-REZ-02)
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "bookingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "bufferMin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "travelBufferMin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "workDays" TEXT NOT NULL DEFAULT '1,2,3,4,5',
ADD COLUMN IF NOT EXISTS "workStart" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS "workEnd" TEXT NOT NULL DEFAULT '18:00';

-- AlterTable: seans müddəti və məkan tipi (FR-REZ-02, FR-REZ-07)
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "durationMin" INTEGER;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "location" "ServiceLocation" NOT NULL DEFAULT 'ONLINE';

-- AlterTable: seçilmiş slot və ünvan (FR-REZ-04, FR-REZ-08)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "scheduledEndAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "address" TEXT;

-- CreateTable: ustanın bağladığı vaxtlar (FR-REZ-06)
CREATE TABLE IF NOT EXISTS "BlockedSlot" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BlockedSlot_profileId_start_idx" ON "BlockedSlot"("profileId", "start");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_profileId_scheduledAt_idx" ON "Order"("profileId", "scheduledAt");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "BlockedSlot" ADD CONSTRAINT "BlockedSlot_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
