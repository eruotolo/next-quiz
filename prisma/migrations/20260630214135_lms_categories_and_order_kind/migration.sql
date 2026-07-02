-- CreateEnum
CREATE TYPE "B2cOrderKind" AS ENUM ('COURSE', 'CATEGORY_BUNDLE');

-- AlterTable
ALTER TABLE "LmsOrder" ADD COLUMN     "categoryId" UUID,
ADD COLUMN     "kind" "B2cOrderKind" NOT NULL DEFAULT 'COURSE',
ALTER COLUMN "courseId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "LmsCategory" (
    "id" UUID NOT NULL,
    "academicInstitutionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isBundle" BOOLEAN NOT NULL DEFAULT false,
    "bundlePrice" DOUBLE PRECISION,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsCourseCategory" (
    "courseId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsCourseCategory_pkey" PRIMARY KEY ("courseId","categoryId")
);

-- CreateIndex
CREATE INDEX "LmsCategory_academicInstitutionId_order_idx" ON "LmsCategory"("academicInstitutionId", "order");

-- CreateIndex
CREATE INDEX "LmsCategory_academicInstitutionId_isBundle_idx" ON "LmsCategory"("academicInstitutionId", "isBundle");

-- CreateIndex
CREATE UNIQUE INDEX "LmsCategory_academicInstitutionId_slug_key" ON "LmsCategory"("academicInstitutionId", "slug");

-- CreateIndex
CREATE INDEX "LmsCourseCategory_categoryId_idx" ON "LmsCourseCategory"("categoryId");

-- CreateIndex
CREATE INDEX "LmsOrder_categoryId_idx" ON "LmsOrder"("categoryId");

-- AddForeignKey
ALTER TABLE "LmsOrder" ADD CONSTRAINT "LmsOrder_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LmsCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsCategory" ADD CONSTRAINT "LmsCategory_academicInstitutionId_fkey" FOREIGN KEY ("academicInstitutionId") REFERENCES "AcademicInstitution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsCourseCategory" ADD CONSTRAINT "LmsCourseCategory_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsCourseCategory" ADD CONSTRAINT "LmsCourseCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LmsCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
