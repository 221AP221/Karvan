-- Xidmətin ünvanı/xəritə linki və qalereya şəkilləri

-- AlterTable
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "mapUrl" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ServiceImage" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ServiceImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ServiceImage_serviceId_position_idx" ON "ServiceImage"("serviceId", "position");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "ServiceImage" ADD CONSTRAINT "ServiceImage_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
