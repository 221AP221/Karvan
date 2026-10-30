-- AlterEnum
ALTER TYPE "Plan" ADD VALUE 'PRO_MAX';

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "showInCatalog" BOOLEAN NOT NULL DEFAULT true;

