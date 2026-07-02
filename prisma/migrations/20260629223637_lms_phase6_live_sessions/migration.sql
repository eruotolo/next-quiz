-- CreateEnum
CREATE TYPE "LiveSessionStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "LiveAttendanceRole" AS ENUM ('TEACHER', 'STUDENT', 'GUEST', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "LiveRecordingStatus" AS ENUM ('NONE', 'PENDING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "LmsLiveSession" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "dailyRoomName" TEXT NOT NULL,
    "dailyRoomUrl" TEXT NOT NULL,
    "dailyRoomExpiresAt" TIMESTAMP(3) NOT NULL,
    "maxParticipants" INTEGER,
    "status" "LiveSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdById" UUID NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "recordingMuxAssetId" TEXT,
    "recordingUrl" TEXT,
    "recordingDurationSec" INTEGER,
    "recordingStatus" "LiveRecordingStatus" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsLiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsLiveAttendance" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "LiveAttendanceRole" NOT NULL DEFAULT 'STUDENT',
    "displayName" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "leftAt" TIMESTAMP(3),
    "durationSec" INTEGER,
    "dailyParticipantId" TEXT,

    CONSTRAINT "LmsLiveAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsLiveChatMessage" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LmsLiveChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsWhiteboardSnapshot" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "pngUrl" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsWhiteboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LmsLiveSession_dailyRoomName_key" ON "LmsLiveSession"("dailyRoomName");

-- CreateIndex
CREATE INDEX "LmsLiveSession_courseId_idx" ON "LmsLiveSession"("courseId");

-- CreateIndex
CREATE INDEX "LmsLiveSession_status_idx" ON "LmsLiveSession"("status");

-- CreateIndex
CREATE INDEX "LmsLiveSession_scheduledAt_idx" ON "LmsLiveSession"("scheduledAt");

-- CreateIndex
CREATE INDEX "LmsLiveSession_createdById_idx" ON "LmsLiveSession"("createdById");

-- CreateIndex
CREATE INDEX "LmsLiveAttendance_sessionId_idx" ON "LmsLiveAttendance"("sessionId");

-- CreateIndex
CREATE INDEX "LmsLiveAttendance_userId_idx" ON "LmsLiveAttendance"("userId");

-- CreateIndex
CREATE INDEX "LmsLiveAttendance_sessionId_userId_idx" ON "LmsLiveAttendance"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "LmsLiveChatMessage_sessionId_sentAt_idx" ON "LmsLiveChatMessage"("sessionId", "sentAt");

-- CreateIndex
CREATE INDEX "LmsLiveChatMessage_userId_idx" ON "LmsLiveChatMessage"("userId");

-- CreateIndex
CREATE INDEX "LmsWhiteboardSnapshot_sessionId_createdAt_idx" ON "LmsWhiteboardSnapshot"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "LmsWhiteboardSnapshot_userId_idx" ON "LmsWhiteboardSnapshot"("userId");

-- AddForeignKey
ALTER TABLE "LmsLiveSession" ADD CONSTRAINT "LmsLiveSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLiveSession" ADD CONSTRAINT "LmsLiveSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLiveAttendance" ADD CONSTRAINT "LmsLiveAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LmsLiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLiveAttendance" ADD CONSTRAINT "LmsLiveAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLiveChatMessage" ADD CONSTRAINT "LmsLiveChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LmsLiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLiveChatMessage" ADD CONSTRAINT "LmsLiveChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsWhiteboardSnapshot" ADD CONSTRAINT "LmsWhiteboardSnapshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LmsLiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsWhiteboardSnapshot" ADD CONSTRAINT "LmsWhiteboardSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
