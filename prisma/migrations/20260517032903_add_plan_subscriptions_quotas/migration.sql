/*
  Warnings:

  - The `plan` column on the `AcademicInstitution` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'DOCENTE', 'COLEGIO', 'INSTITUCIONAL');

-- AlterTable
ALTER TABLE "AcademicInstitution" ADD COLUMN     "mpCustomerId" TEXT,
ADD COLUMN     "mpSubscriptionId" TEXT,
ADD COLUMN     "planExpiresAt" TIMESTAMP(3),
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "seoTitle" TEXT,
DROP COLUMN "plan",
ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "academicInstitutionId" UUID,
ADD COLUMN     "createdById" UUID;

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "academicInstitutionId" UUID;

-- CreateTable
CREATE TABLE "PlanLimits" (
    "id" UUID NOT NULL,
    "plan" "Plan" NOT NULL,
    "maxGroups" INTEGER,
    "maxAdmins" INTEGER,
    "maxProfessors" INTEGER,
    "maxStudents" INTEGER,
    "maxExamsPerYear" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanLimits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "academicInstitutionId" UUID NOT NULL,
    "plan" "Plan" NOT NULL,
    "status" TEXT NOT NULL,
    "mpPaymentId" TEXT,
    "mpPreferenceId" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'CLP',
    "startedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanLimits_plan_key" ON "PlanLimits"("plan");

-- CreateIndex
CREATE INDEX "Subscription_academicInstitutionId_idx" ON "Subscription"("academicInstitutionId");

-- CreateIndex
CREATE INDEX "Subscription_mpPaymentId_idx" ON "Subscription"("mpPaymentId");

-- CreateIndex
CREATE INDEX "Exam_academicInstitutionId_idx" ON "Exam"("academicInstitutionId");

-- CreateIndex
CREATE INDEX "Exam_createdById_idx" ON "Exam"("createdById");

-- CreateIndex
CREATE INDEX "Group_academicInstitutionId_idx" ON "Group"("academicInstitutionId");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_academicInstitutionId_fkey" FOREIGN KEY ("academicInstitutionId") REFERENCES "AcademicInstitution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_academicInstitutionId_fkey" FOREIGN KEY ("academicInstitutionId") REFERENCES "AcademicInstitution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_academicInstitutionId_fkey" FOREIGN KEY ("academicInstitutionId") REFERENCES "AcademicInstitution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
