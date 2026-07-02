-- AlterTable
ALTER TABLE "LmsNotification" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "LmsNotification" ADD COLUMN "dedupeKey" TEXT;

-- CreateIndex
CREATE INDEX "LmsNotification_dedupeKey_idx" ON "LmsNotification"("dedupeKey");
