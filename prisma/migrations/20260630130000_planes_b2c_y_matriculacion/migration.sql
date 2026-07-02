-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- DropIndex
DROP INDEX "PlanLimits_plan_key";

-- AlterTable
ALTER TABLE "AcademicInstitution" ADD COLUMN     "examsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "examsPlanCode" TEXT DEFAULT 'exams_free',
ADD COLUMN     "examsPlanExpiresAt" TIMESTAMP(3),
ADD COLUMN     "lmsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lmsPlanCode" TEXT DEFAULT 'lms_free',
ADD COLUMN     "lmsPlanExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "LmsCourse" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "price" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PlanLimits" ADD COLUMN     "planCode" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activationToken" TEXT,
ADD COLUMN     "activationTokenExp" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "LmsOrder" (
    "id" UUID NOT NULL,
    "studentRut" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentLastname" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "courseId" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDIENTE',
    "mpPreferenceId" TEXT,
    "mpPaymentId" TEXT,
    "enrolledUserId" UUID,
    "enrollmentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LmsOrder_mpPaymentId_key" ON "LmsOrder"("mpPaymentId");

-- CreateIndex
CREATE INDEX "LmsOrder_courseId_idx" ON "LmsOrder"("courseId");

-- CreateIndex
CREATE INDEX "LmsOrder_studentRut_idx" ON "LmsOrder"("studentRut");

-- CreateIndex
CREATE INDEX "LmsOrder_status_idx" ON "LmsOrder"("status");

-- CreateIndex
CREATE INDEX "LmsOrder_createdAt_idx" ON "LmsOrder"("createdAt");

-- CreateIndex
CREATE INDEX "PlanLimits_planCode_idx" ON "PlanLimits"("planCode");

-- CreateIndex
CREATE UNIQUE INDEX "PlanLimits_plan_planCode_key" ON "PlanLimits"("plan", "planCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_activationToken_key" ON "User"("activationToken");

-- AddForeignKey
ALTER TABLE "LmsOrder" ADD CONSTRAINT "LmsOrder_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
