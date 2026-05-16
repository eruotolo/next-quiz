/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `AcademicInstitution` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `address` to the `AcademicInstitution` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `AcademicInstitution` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `AcademicInstitution` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `AcademicInstitution` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `AcademicInstitution` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AcademicInstitution" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "campus" TEXT,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AcademicInstitution_slug_key" ON "AcademicInstitution"("slug");
