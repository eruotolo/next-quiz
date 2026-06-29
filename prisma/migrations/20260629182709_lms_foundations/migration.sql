-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'DOCUMENTO', 'TEXTO', 'ENLACE', 'EXAMEN', 'TAREA', 'EN_VIVO');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVO', 'COMPLETADO', 'RETIRADO');

-- CreateTable
CREATE TABLE "LmsCourse" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "academicInstitutionId" UUID,
    "courseSectionId" UUID,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsModule" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "courseId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsLesson" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" "LessonType" NOT NULL DEFAULT 'TEXTO',
    "order" INTEGER NOT NULL DEFAULT 0,
    "contentJson" JSONB,
    "videoAssetId" TEXT,
    "videoUploadId" TEXT,
    "fileUrl" TEXT,
    "externalLink" TEXT,
    "durationSec" INTEGER,
    "examId" UUID,
    "moduleId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsEnrollment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVO',
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LmsEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsLessonProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenSec" INTEGER,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsLessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LmsCourse_academicInstitutionId_idx" ON "LmsCourse"("academicInstitutionId");

-- CreateIndex
CREATE INDEX "LmsCourse_courseSectionId_idx" ON "LmsCourse"("courseSectionId");

-- CreateIndex
CREATE INDEX "LmsCourse_published_idx" ON "LmsCourse"("published");

-- CreateIndex
CREATE INDEX "LmsCourse_createdById_idx" ON "LmsCourse"("createdById");

-- CreateIndex
CREATE INDEX "LmsModule_courseId_idx" ON "LmsModule"("courseId");

-- CreateIndex
CREATE INDEX "LmsLesson_moduleId_idx" ON "LmsLesson"("moduleId");

-- CreateIndex
CREATE INDEX "LmsLesson_examId_idx" ON "LmsLesson"("examId");

-- CreateIndex
CREATE INDEX "LmsEnrollment_courseId_idx" ON "LmsEnrollment"("courseId");

-- CreateIndex
CREATE INDEX "LmsEnrollment_userId_idx" ON "LmsEnrollment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsEnrollment_userId_courseId_key" ON "LmsEnrollment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "LmsLessonProgress_lessonId_idx" ON "LmsLessonProgress"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsLessonProgress_userId_lessonId_key" ON "LmsLessonProgress"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "LmsCourse" ADD CONSTRAINT "LmsCourse_academicInstitutionId_fkey" FOREIGN KEY ("academicInstitutionId") REFERENCES "AcademicInstitution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsCourse" ADD CONSTRAINT "LmsCourse_courseSectionId_fkey" FOREIGN KEY ("courseSectionId") REFERENCES "CourseSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsCourse" ADD CONSTRAINT "LmsCourse_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsModule" ADD CONSTRAINT "LmsModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLesson" ADD CONSTRAINT "LmsLesson_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLesson" ADD CONSTRAINT "LmsLesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "LmsModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsEnrollment" ADD CONSTRAINT "LmsEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsEnrollment" ADD CONSTRAINT "LmsEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLessonProgress" ADD CONSTRAINT "LmsLessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLessonProgress" ADD CONSTRAINT "LmsLessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "LmsLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
