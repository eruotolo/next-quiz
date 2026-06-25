-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('COLEGIO', 'LICEO_TECNICO', 'PREUNIVERSITARIO', 'UNIVERSIDAD', 'INSTITUTO_PROFESIONAL', 'CFT', 'OTRO');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('ANUAL', 'SEMESTRE', 'TRIMESTRE', 'MODULO', 'OTRO');

-- AlterTable
ALTER TABLE "AcademicInstitution" ADD COLUMN     "type" "InstitutionType" NOT NULL DEFAULT 'OTRO';

-- AlterTable
ALTER TABLE "CustomPlan" ADD COLUMN     "maxCourses" INTEGER,
ADD COLUMN     "maxPrograms" INTEGER;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "courseSectionId" UUID;

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "programId" UUID;

-- AlterTable
ALTER TABLE "PlanLimits" ADD COLUMN     "maxCourses" INTEGER,
ADD COLUMN     "maxPrograms" INTEGER;

-- CreateTable
CREATE TABLE "Program" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "academicInstitutionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicPeriod" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "type" "PeriodType" NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "academicInstitutionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseSection" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "programId" UUID,
    "periodId" UUID NOT NULL,
    "groupId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramCoordinator" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramCoordinator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CourseSectionTeachers" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_CourseSectionTeachers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Program_academicInstitutionId_idx" ON "Program"("academicInstitutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Program_academicInstitutionId_name_key" ON "Program"("academicInstitutionId", "name");

-- CreateIndex
CREATE INDEX "AcademicPeriod_academicInstitutionId_idx" ON "AcademicPeriod"("academicInstitutionId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicPeriod_academicInstitutionId_name_key" ON "AcademicPeriod"("academicInstitutionId", "name");

-- CreateIndex
CREATE INDEX "CourseSection_programId_idx" ON "CourseSection"("programId");

-- CreateIndex
CREATE INDEX "CourseSection_periodId_idx" ON "CourseSection"("periodId");

-- CreateIndex
CREATE INDEX "CourseSection_groupId_idx" ON "CourseSection"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseSection_programId_periodId_name_groupId_key" ON "CourseSection"("programId", "periodId", "name", "groupId");

-- CreateIndex
CREATE INDEX "ProgramCoordinator_programId_idx" ON "ProgramCoordinator"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramCoordinator_userId_programId_key" ON "ProgramCoordinator"("userId", "programId");

-- CreateIndex
CREATE INDEX "_CourseSectionTeachers_B_index" ON "_CourseSectionTeachers"("B");

-- CreateIndex
CREATE INDEX "Exam_courseSectionId_idx" ON "Exam"("courseSectionId");

-- CreateIndex
CREATE INDEX "Group_programId_idx" ON "Group"("programId");

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_academicInstitutionId_fkey" FOREIGN KEY ("academicInstitutionId") REFERENCES "AcademicInstitution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicPeriod" ADD CONSTRAINT "AcademicPeriod_academicInstitutionId_fkey" FOREIGN KEY ("academicInstitutionId") REFERENCES "AcademicInstitution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSection" ADD CONSTRAINT "CourseSection_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSection" ADD CONSTRAINT "CourseSection_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSection" ADD CONSTRAINT "CourseSection_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramCoordinator" ADD CONSTRAINT "ProgramCoordinator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramCoordinator" ADD CONSTRAINT "ProgramCoordinator_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_courseSectionId_fkey" FOREIGN KEY ("courseSectionId") REFERENCES "CourseSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseSectionTeachers" ADD CONSTRAINT "_CourseSectionTeachers_A_fkey" FOREIGN KEY ("A") REFERENCES "CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseSectionTeachers" ADD CONSTRAINT "_CourseSectionTeachers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
