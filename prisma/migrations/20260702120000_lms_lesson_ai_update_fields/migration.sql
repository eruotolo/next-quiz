-- AlterTable
ALTER TABLE "LmsLesson" ADD COLUMN "lastAiUpdateAt" TIMESTAMP(3),
ADD COLUMN "aiUpdateSource" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LmsLesson_lastAiUpdateAt_idx" ON "LmsLesson"("lastAiUpdateAt");