-- AlterTable
ALTER TABLE "AcademicInstitution" ADD COLUMN     "customPlanId" UUID;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "WebhookEvent" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "CustomPlan" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "maxGroups" INTEGER,
    "maxAdmins" INTEGER,
    "maxProfessors" INTEGER,
    "maxStudents" INTEGER,
    "maxExamsPerYear" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomPlan_name_key" ON "CustomPlan"("name");

-- CreateIndex
CREATE INDEX "AcademicInstitution_customPlanId_idx" ON "AcademicInstitution"("customPlanId");

-- AddForeignKey
ALTER TABLE "AcademicInstitution" ADD CONSTRAINT "AcademicInstitution_customPlanId_fkey" FOREIGN KEY ("customPlanId") REFERENCES "CustomPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
