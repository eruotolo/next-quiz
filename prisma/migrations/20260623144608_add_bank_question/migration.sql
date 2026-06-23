-- CreateTable
CREATE TABLE "BankQuestion" (
    "id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL DEFAULT 'UNICA',
    "subject" TEXT,
    "unit" TEXT,
    "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIA',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "feedback" TEXT,
    "academicInstitutionId" UUID,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankOption" (
    "id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "bankQuestionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankQuestion_academicInstitutionId_idx" ON "BankQuestion"("academicInstitutionId");

-- CreateIndex
CREATE INDEX "BankQuestion_subject_unit_idx" ON "BankQuestion"("subject", "unit");

-- CreateIndex
CREATE INDEX "BankQuestion_difficulty_idx" ON "BankQuestion"("difficulty");

-- CreateIndex
CREATE INDEX "BankQuestion_createdById_idx" ON "BankQuestion"("createdById");

-- CreateIndex
CREATE INDEX "BankOption_bankQuestionId_idx" ON "BankOption"("bankQuestionId");

-- AddForeignKey
ALTER TABLE "BankQuestion" ADD CONSTRAINT "BankQuestion_academicInstitutionId_fkey" FOREIGN KEY ("academicInstitutionId") REFERENCES "AcademicInstitution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankQuestion" ADD CONSTRAINT "BankQuestion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankOption" ADD CONSTRAINT "BankOption_bankQuestionId_fkey" FOREIGN KEY ("bankQuestionId") REFERENCES "BankQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
