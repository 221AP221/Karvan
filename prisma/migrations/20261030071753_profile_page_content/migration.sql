-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SocialPlatform" ADD VALUE 'FACEBOOK';
ALTER TYPE "SocialPlatform" ADD VALUE 'LINKEDIN';
ALTER TYPE "SocialPlatform" ADD VALUE 'BEHANCE';
ALTER TYPE "SocialPlatform" ADD VALUE 'DRIBBBLE';
ALTER TYPE "SocialPlatform" ADD VALUE 'X';
ALTER TYPE "SocialPlatform" ADD VALUE 'THREADS';
ALTER TYPE "SocialPlatform" ADD VALUE 'PINTEREST';
ALTER TYPE "SocialPlatform" ADD VALUE 'EMAIL';
ALTER TYPE "SocialPlatform" ADD VALUE 'WEBSITE';

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "about" TEXT,
ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "profession" TEXT;

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Media_profileId_idx" ON "Media"("profileId");

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
