-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
-- CreateEnum
CREATE TYPE "QuizVisibility" AS ENUM ('ENROLLED', 'ALL');
-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'SHORT');
-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');
-- CreateEnum
CREATE TYPE "AnalogyInteractionType" AS ENUM ('VIEW', 'REVISIT');

CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "QuizStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "QuizVisibility" NOT NULL DEFAULT 'ENROLLED',
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "dueAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "moduleId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'MCQ',
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quizId" TEXT NOT NULL,
    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuizOption" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL,
    "questionId" TEXT NOT NULL,
    CONSTRAINT "QuizOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quizId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuizResponse" (
    "id" TEXT NOT NULL,
    "textAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    CONSTRAINT "QuizResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalogyInteraction" (
    "id" TEXT NOT NULL,
    "type" "AnalogyInteractionType" NOT NULL DEFAULT 'VIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analogySetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "AnalogyInteraction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Quiz_moduleId_idx" ON "Quiz"("moduleId");
CREATE INDEX "Quiz_ownerId_idx" ON "Quiz"("ownerId");
CREATE INDEX "Quiz_status_idx" ON "Quiz"("status");
CREATE INDEX "QuizQuestion_quizId_idx" ON "QuizQuestion"("quizId");
CREATE UNIQUE INDEX "QuizQuestion_quizId_orderIndex_key" ON "QuizQuestion"("quizId", "orderIndex");
CREATE INDEX "QuizOption_questionId_idx" ON "QuizOption"("questionId");
CREATE UNIQUE INDEX "QuizOption_questionId_orderIndex_key" ON "QuizOption"("questionId", "orderIndex");
CREATE INDEX "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");
CREATE INDEX "QuizAttempt_studentId_idx" ON "QuizAttempt"("studentId");
CREATE INDEX "QuizAttempt_status_idx" ON "QuizAttempt"("status");
CREATE INDEX "QuizResponse_questionId_idx" ON "QuizResponse"("questionId");
CREATE UNIQUE INDEX "QuizResponse_attemptId_questionId_key" ON "QuizResponse"("attemptId", "questionId");
CREATE INDEX "AnalogyInteraction_analogySetId_idx" ON "AnalogyInteraction"("analogySetId");
CREATE INDEX "AnalogyInteraction_userId_idx" ON "AnalogyInteraction"("userId");
CREATE INDEX "AnalogyInteraction_type_idx" ON "AnalogyInteraction"("type");

ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizOption" ADD CONSTRAINT "QuizOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizResponse" ADD CONSTRAINT "QuizResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizResponse" ADD CONSTRAINT "QuizResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizResponse" ADD CONSTRAINT "QuizResponse_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "QuizOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalogyInteraction" ADD CONSTRAINT "AnalogyInteraction_analogySetId_fkey" FOREIGN KEY ("analogySetId") REFERENCES "AnalogySet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalogyInteraction" ADD CONSTRAINT "AnalogyInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
