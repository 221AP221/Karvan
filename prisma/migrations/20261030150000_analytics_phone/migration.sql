-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('VIEW', 'ORDER_OPEN', 'PHONE_CLICK', 'LINK_CLICK');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "source" TEXT,
ADD COLUMN     "visitorId" TEXT;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "ProfileEvent" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "visitorId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "target" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileEvent_profileId_createdAt_idx" ON "ProfileEvent"("profileId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProfileEvent" ADD CONSTRAINT "ProfileEvent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Mövcud səhifələrdə əlaqə nömrəsi qeydiyyatdakı nömrə ilə doldurulur (sonradan dəyişmək/silmək olar)
UPDATE "Profile" p SET "phone" = u."phone" FROM "User" u WHERE p."userId" = u."id" AND u."phone" IS NOT NULL;
