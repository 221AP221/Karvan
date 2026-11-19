-- CreateIndex
-- IF NOT EXISTS: lokal bazada (PGlite, tək bağlantı) bu miqrasiya yarımçıq kəsilib yenidən
-- işlədiləndə "already exists" xətası ilə dayanmasın deyə.
CREATE INDEX IF NOT EXISTS "Order_profileId_createdAt_idx" ON "Order"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");

