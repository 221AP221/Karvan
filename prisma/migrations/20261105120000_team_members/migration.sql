-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "actorName" TEXT,
ADD COLUMN     "actorUserId" TEXT,
ADD COLUMN     "profileId" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "activeProfileId" TEXT;

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT,
    "role" "TeamRole" NOT NULL DEFAULT 'STAFF',
    "status" "MemberStatus" NOT NULL DEFAULT 'INVITED',
    "invitedEmail" TEXT NOT NULL,
    "inviteToken" TEXT,
    "inviteExpiry" TIMESTAMP(3),
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Membership_inviteToken_key" ON "Membership"("inviteToken");

-- CreateIndex
CREATE INDEX "Membership_userId_status_idx" ON "Membership"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_profileId_userId_key" ON "Membership"("profileId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_profileId_invitedEmail_key" ON "Membership"("profileId", "invitedEmail");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Mövcud hər profil üçün sahib üzvlüyü yaradılır: köhnə hesablar olduğu kimi işləyir
INSERT INTO "Membership" ("id", "profileId", "userId", "role", "status", "invitedEmail", "invitedAt", "acceptedAt")
SELECT
  'own_' || substr(md5(random()::text || p."id"), 1, 21),
  p."id",
  p."userId",
  'OWNER',
  'ACTIVE',
  COALESCE(u."email", p."username"),
  NOW(),
  NOW()
FROM "Profile" p
JOIN "User" u ON u."id" = p."userId";
