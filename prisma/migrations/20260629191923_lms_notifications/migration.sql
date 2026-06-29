-- CreateTable
CREATE TABLE "LmsNotification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LmsNotification_userId_read_idx" ON "LmsNotification"("userId", "read");

-- CreateIndex
CREATE INDEX "LmsNotification_userId_createdAt_idx" ON "LmsNotification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "LmsNotification" ADD CONSTRAINT "LmsNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
