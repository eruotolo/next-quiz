/*
  Warnings:

  - You are about to drop the column `leaderboardOptOut` on the `LmsEnrollment` table. All the data in the column will be lost.
  - You are about to drop the column `seen` on the `LmsUserBadge` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "LmsUserBadge_userId_seen_idx";

-- AlterTable
ALTER TABLE "LmsEnrollment" DROP COLUMN "leaderboardOptOut";

-- AlterTable
ALTER TABLE "LmsUserBadge" DROP COLUMN "seen";
