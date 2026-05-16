/*
  Warnings:

  - A unique constraint covering the columns `[attemptKey,questionId,optionId]` on the table `Answer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('UNICA', 'MULTIPLE');

-- DropIndex
DROP INDEX "Answer_attemptKey_questionId_key";

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "questionType" "QuestionType" NOT NULL DEFAULT 'UNICA';

-- CreateIndex
CREATE UNIQUE INDEX "Answer_attemptKey_questionId_optionId_key" ON "Answer"("attemptKey", "questionId", "optionId");
