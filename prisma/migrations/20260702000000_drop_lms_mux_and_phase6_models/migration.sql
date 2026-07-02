-- DropForeignKey
ALTER TABLE "LmsLiveAttendance" DROP CONSTRAINT "LmsLiveAttendance_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "LmsLiveAttendance" DROP CONSTRAINT "LmsLiveAttendance_userId_fkey";

-- DropForeignKey
ALTER TABLE "LmsLiveChatMessage" DROP CONSTRAINT "LmsLiveChatMessage_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "LmsLiveChatMessage" DROP CONSTRAINT "LmsLiveChatMessage_userId_fkey";

-- DropForeignKey
ALTER TABLE "LmsLiveSession" DROP CONSTRAINT "LmsLiveSession_courseId_fkey";

-- DropForeignKey
ALTER TABLE "LmsLiveSession" DROP CONSTRAINT "LmsLiveSession_createdById_fkey";

-- DropForeignKey
ALTER TABLE "LmsWhiteboardSnapshot" DROP CONSTRAINT "LmsWhiteboardSnapshot_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "LmsWhiteboardSnapshot" DROP CONSTRAINT "LmsWhiteboardSnapshot_userId_fkey";

-- AlterTable
ALTER TABLE "LmsLesson" DROP COLUMN "videoAssetId",
DROP COLUMN "videoUploadId";

-- DropTable
DROP TABLE "LmsLiveAttendance";

-- DropTable
DROP TABLE "LmsLiveChatMessage";

-- DropTable
DROP TABLE "LmsLiveSession";

-- DropTable
DROP TABLE "LmsWhiteboardSnapshot";

-- DropEnum
DROP TYPE "LiveAttendanceRole";

-- DropEnum
DROP TYPE "LiveRecordingStatus";

-- DropEnum
DROP TYPE "LiveSessionStatus";

