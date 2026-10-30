-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';


-- Mövcud lokal admin super admin olur
UPDATE "User" SET "role" = 'SUPER_ADMIN' WHERE "email" = 'admin@karvan.az';
