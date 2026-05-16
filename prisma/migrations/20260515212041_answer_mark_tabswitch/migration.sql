-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "answeredAt" TIMESTAMP(3),
ADD COLUMN     "markedForReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timeSpentMs" INTEGER;

-- CreateTable
CREATE TABLE "TabSwitchEvent" (
    "id" UUID NOT NULL,
    "attemptKey" TEXT NOT NULL,
    "studentId" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TabSwitchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TabSwitchEvent_attemptKey_idx" ON "TabSwitchEvent"("attemptKey");

-- CreateIndex
CREATE INDEX "TabSwitchEvent_examId_idx" ON "TabSwitchEvent"("examId");
