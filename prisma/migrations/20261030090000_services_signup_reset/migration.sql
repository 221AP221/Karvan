-- CreateEnum
CREATE TYPE "Citizenship" AS ENUM ('AZ', 'FOREIGN');

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "category" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'AZN',
ADD COLUMN     "durationDays" INTEGER,
ADD COLUMN     "durationMonths" INTEGER,
ADD COLUMN     "durationWeeks" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "citizenship" "Citizenship",
ADD COLUMN     "finCode" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "passportNumber" TEXT;

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_finCode_key" ON "User"("finCode");

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

