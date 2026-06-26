-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "periodId" UUID;

-- CreateIndex
CREATE INDEX "Group_periodId_idx" ON "Group"("periodId");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
