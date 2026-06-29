-- CreateEnum
CREATE TYPE "LmsPointSource" AS ENUM ('LESSON_COMPLETED', 'ASSIGNMENT_SUBMITTED', 'ASSIGNMENT_GRADED', 'EXAM_PASSED', 'FORUM_POST', 'MANUAL', 'STREAK_BONUS');

-- CreateTable
CREATE TABLE "LmsStreak" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveOn" DATE,
    "freezeTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsBadge" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "pointsReward" INTEGER NOT NULL DEFAULT 0,
    "criteria" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsUserBadge" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "badgeId" UUID NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "awardedReason" TEXT,

    CONSTRAINT "LmsUserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsPointEvent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "sourceType" "LmsPointSource" NOT NULL,
    "sourceId" UUID,
    "courseId" UUID,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsPointEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LmsStreak_userId_key" ON "LmsStreak"("userId");

-- CreateIndex
CREATE INDEX "LmsStreak_userId_idx" ON "LmsStreak"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsBadge_code_key" ON "LmsBadge"("code");

-- CreateIndex
CREATE INDEX "LmsBadge_code_idx" ON "LmsBadge"("code");

-- CreateIndex
CREATE INDEX "LmsBadge_active_idx" ON "LmsBadge"("active");

-- CreateIndex
CREATE INDEX "LmsUserBadge_userId_idx" ON "LmsUserBadge"("userId");

-- CreateIndex
CREATE INDEX "LmsUserBadge_badgeId_idx" ON "LmsUserBadge"("badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsUserBadge_userId_badgeId_key" ON "LmsUserBadge"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsPointEvent_dedupeKey_key" ON "LmsPointEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "LmsPointEvent_userId_createdAt_idx" ON "LmsPointEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LmsPointEvent_courseId_idx" ON "LmsPointEvent"("courseId");

-- CreateIndex
CREATE INDEX "LmsPointEvent_sourceType_idx" ON "LmsPointEvent"("sourceType");

-- AddForeignKey
ALTER TABLE "LmsStreak" ADD CONSTRAINT "LmsStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsUserBadge" ADD CONSTRAINT "LmsUserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsUserBadge" ADD CONSTRAINT "LmsUserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "LmsBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsPointEvent" ADD CONSTRAINT "LmsPointEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsPointEvent" ADD CONSTRAINT "LmsPointEvent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
