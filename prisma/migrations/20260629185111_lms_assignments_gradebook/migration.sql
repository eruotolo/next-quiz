-- CreateEnum
CREATE TYPE "LmsSubmissionStatus" AS ENUM ('PENDIENTE', 'ENTREGADO', 'CALIFICADO', 'ATRASADO');

-- CreateEnum
CREATE TYPE "LmsGradebookItemType" AS ENUM ('EXAMEN', 'TAREA', 'PARTICIPACION', 'MANUAL');

-- CreateTable
CREATE TABLE "LmsAssignment" (
    "id" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "instructions" TEXT,
    "dueAt" TIMESTAMP(3),
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsSubmission" (
    "id" UUID NOT NULL,
    "assignmentId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "fileUrl" TEXT,
    "textContent" TEXT,
    "status" "LmsSubmissionStatus" NOT NULL DEFAULT 'PENDIENTE',
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3),
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsGradebookItem" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" "LmsGradebookItemType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "assignmentId" UUID,
    "examId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsGradebookItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsGrade" (
    "id" UUID NOT NULL,
    "gradebookItemId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsGrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LmsAssignment_lessonId_key" ON "LmsAssignment"("lessonId");

-- CreateIndex
CREATE INDEX "LmsAssignment_lessonId_idx" ON "LmsAssignment"("lessonId");

-- CreateIndex
CREATE INDEX "LmsSubmission_studentId_idx" ON "LmsSubmission"("studentId");

-- CreateIndex
CREATE INDEX "LmsSubmission_assignmentId_idx" ON "LmsSubmission"("assignmentId");

-- CreateIndex
CREATE INDEX "LmsSubmission_status_idx" ON "LmsSubmission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LmsSubmission_assignmentId_studentId_key" ON "LmsSubmission"("assignmentId", "studentId");

-- CreateIndex
CREATE INDEX "LmsGradebookItem_courseId_idx" ON "LmsGradebookItem"("courseId");

-- CreateIndex
CREATE INDEX "LmsGradebookItem_examId_idx" ON "LmsGradebookItem"("examId");

-- CreateIndex
CREATE INDEX "LmsGrade_studentId_idx" ON "LmsGrade"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsGrade_gradebookItemId_studentId_key" ON "LmsGrade"("gradebookItemId", "studentId");

-- AddForeignKey
ALTER TABLE "LmsAssignment" ADD CONSTRAINT "LmsAssignment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "LmsLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsSubmission" ADD CONSTRAINT "LmsSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "LmsAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsSubmission" ADD CONSTRAINT "LmsSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsGradebookItem" ADD CONSTRAINT "LmsGradebookItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsGradebookItem" ADD CONSTRAINT "LmsGradebookItem_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsGrade" ADD CONSTRAINT "LmsGrade_gradebookItemId_fkey" FOREIGN KEY ("gradebookItemId") REFERENCES "LmsGradebookItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsGrade" ADD CONSTRAINT "LmsGrade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
