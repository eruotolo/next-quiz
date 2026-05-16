-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('FACIL', 'MEDIA', 'DIFICIL');

-- AlterTable
ALTER TABLE "AcademicInstitution" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "allowedEmailDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "plan" TEXT;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "closesAt" TIMESTAMP(3),
ADD COLUMN     "lockTabSwitch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oneAttempt" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "randomizeOptions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "uniqueIp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "stream" TEXT,
ADD COLUMN     "tutorId" UUID;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIA',
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Group_tutorId_idx" ON "Group"("tutorId");

-- CreateIndex
CREATE INDEX "Question_subject_unit_idx" ON "Question"("subject", "unit");

-- CreateIndex
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
