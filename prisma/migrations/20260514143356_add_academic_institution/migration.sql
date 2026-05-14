-- AlterTable
ALTER TABLE "User" ADD COLUMN     "academicInstitutionId" UUID;

-- CreateTable
CREATE TABLE "AcademicInstitution" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicInstitution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicInstitution_name_key" ON "AcademicInstitution"("name");

-- CreateIndex
CREATE INDEX "User_academicInstitutionId_idx" ON "User"("academicInstitutionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_academicInstitutionId_fkey" FOREIGN KEY ("academicInstitutionId") REFERENCES "AcademicInstitution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
