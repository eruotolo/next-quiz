-- AlterTable
ALTER TABLE "LmsCourse" ADD COLUMN     "aiSummaryEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "certificateEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "LmsLesson" ADD COLUMN     "summaryJson" JSONB;

-- CreateTable
CREATE TABLE "LmsCertificate" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "finalGrade" DECIMAL(3,1),
    "pdfUrl" TEXT,
    "qrCodeUrl" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "LmsCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LmsCertificate_verificationCode_key" ON "LmsCertificate"("verificationCode");

-- CreateIndex
CREATE INDEX "LmsCertificate_courseId_idx" ON "LmsCertificate"("courseId");

-- CreateIndex
CREATE INDEX "LmsCertificate_verificationCode_idx" ON "LmsCertificate"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "LmsCertificate_userId_courseId_key" ON "LmsCertificate"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "LmsCertificate" ADD CONSTRAINT "LmsCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsCertificate" ADD CONSTRAINT "LmsCertificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
