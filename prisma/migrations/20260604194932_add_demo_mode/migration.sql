-- AlterTable
ALTER TABLE "AcademicInstitution" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "demoSessionId" TEXT;

-- CreateIndex
CREATE INDEX "Exam_demoSessionId_idx" ON "Exam"("demoSessionId");
