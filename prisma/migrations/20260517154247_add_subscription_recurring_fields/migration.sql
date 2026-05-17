/*
  Warnings:

  - You are about to drop the column `mpPaymentId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `mpPreferenceId` on the `Subscription` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_academicInstitutionId_fkey";

-- DropIndex
DROP INDEX "Subscription_mpPaymentId_idx";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "mpPaymentId",
DROP COLUMN "mpPreferenceId",
ADD COLUMN     "billing" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN     "mpPlanId" TEXT,
ADD COLUMN     "mpSubscriptionId" TEXT,
ALTER COLUMN "academicInstitutionId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Subscription_mpSubscriptionId_idx" ON "Subscription"("mpSubscriptionId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_academicInstitutionId_fkey" FOREIGN KEY ("academicInstitutionId") REFERENCES "AcademicInstitution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
