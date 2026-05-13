-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "antiCheatEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "_ExamToGroup" ADD CONSTRAINT "_ExamToGroup_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ExamToGroup_AB_unique";
