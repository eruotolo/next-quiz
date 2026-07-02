-- CreateTable
CREATE TABLE "LmsForum" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsForum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsForumThread" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "authorId" UUID NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "lastPostAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsForumThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsForumPost" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "parentPostId" UUID,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsForumPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LmsForum_courseId_idx" ON "LmsForum"("courseId");

-- CreateIndex
CREATE INDEX "LmsForumThread_forumId_idx" ON "LmsForumThread"("forumId");

-- CreateIndex
CREATE INDEX "LmsForumThread_authorId_idx" ON "LmsForumThread"("authorId");

-- CreateIndex
CREATE INDEX "LmsForumThread_pinned_lastPostAt_idx" ON "LmsForumThread"("pinned", "lastPostAt");

-- CreateIndex
CREATE INDEX "LmsForumPost_threadId_idx" ON "LmsForumPost"("threadId");

-- CreateIndex
CREATE INDEX "LmsForumPost_parentPostId_idx" ON "LmsForumPost"("parentPostId");

-- CreateIndex
CREATE INDEX "LmsForumPost_authorId_idx" ON "LmsForumPost"("authorId");

-- CreateIndex
CREATE INDEX "LmsForumPost_createdAt_idx" ON "LmsForumPost"("createdAt");

-- AddForeignKey
ALTER TABLE "LmsForum" ADD CONSTRAINT "LmsForum_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsForumThread" ADD CONSTRAINT "LmsForumThread_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "LmsForum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsForumThread" ADD CONSTRAINT "LmsForumThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsForumPost" ADD CONSTRAINT "LmsForumPost_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "LmsForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsForumPost" ADD CONSTRAINT "LmsForumPost_parentPostId_fkey" FOREIGN KEY ("parentPostId") REFERENCES "LmsForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsForumPost" ADD CONSTRAINT "LmsForumPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
