-- CreateTable: implicit many-to-many join table for Exam <-> Group
CREATE TABLE "_ExamToGroup" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

CREATE UNIQUE INDEX "_ExamToGroup_AB_unique" ON "_ExamToGroup"("A", "B");
CREATE INDEX "_ExamToGroup_B_index" ON "_ExamToGroup"("B");

ALTER TABLE "_ExamToGroup" ADD CONSTRAINT "_ExamToGroup_A_fkey"
    FOREIGN KEY ("A") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ExamToGroup" ADD CONSTRAINT "_ExamToGroup_B_fkey"
    FOREIGN KEY ("B") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing groupId data to join table
INSERT INTO "_ExamToGroup" ("A", "B")
SELECT "id", "groupId" FROM "Exam" WHERE "groupId" IS NOT NULL;

-- AddColumn: grading scale fields
ALTER TABLE "Exam" ADD COLUMN "maxGrade" DOUBLE PRECISION NOT NULL DEFAULT 7;
ALTER TABLE "Exam" ADD COLUMN "passingGrade" DOUBLE PRECISION NOT NULL DEFAULT 4;
ALTER TABLE "Exam" ADD COLUMN "passingPercentage" INTEGER NOT NULL DEFAULT 60;

-- DropForeignKey / DropIndex / DropColumn: remove old groupId
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_groupId_fkey";
DROP INDEX "Exam_groupId_idx";
ALTER TABLE "Exam" DROP COLUMN "groupId";
