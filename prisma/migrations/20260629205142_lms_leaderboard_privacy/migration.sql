-- AlterTable
ALTER TABLE "LmsEnrollment" ADD COLUMN     "leaderboardOptOut" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "LmsUserBadge" ADD COLUMN     "seen" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LmsLeaderboardOptOut" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "optedOutAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsLeaderboardOptOut_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LmsLeaderboardOptOut_courseId_idx" ON "LmsLeaderboardOptOut"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsLeaderboardOptOut_userId_courseId_key" ON "LmsLeaderboardOptOut"("userId", "courseId");

-- CreateIndex
CREATE INDEX "LmsUserBadge_userId_seen_idx" ON "LmsUserBadge"("userId", "seen");

-- AddForeignKey
ALTER TABLE "LmsLeaderboardOptOut" ADD CONSTRAINT "LmsLeaderboardOptOut_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLeaderboardOptOut" ADD CONSTRAINT "LmsLeaderboardOptOut_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
