-- Add explicit quiz-question media mapping fields
ALTER TABLE "QuizQuestion"
  ADD COLUMN "videoUrl" TEXT,
  ADD COLUMN "analogyTopicIndex" INTEGER,
  ADD COLUMN "analogySetId" TEXT;

CREATE INDEX "QuizQuestion_analogySetId_idx" ON "QuizQuestion"("analogySetId");
ALTER TABLE "QuizQuestion"
  ADD CONSTRAINT "QuizQuestion_analogySetId_fkey"
  FOREIGN KEY ("analogySetId") REFERENCES "AnalogySet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add timestamp for per-question answer timing
ALTER TABLE "QuizResponse"
  ADD COLUMN "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Track per-question media interactions inside quiz attempts
CREATE TYPE "QuizQuestionInteractionType" AS ENUM ('ANALOGY_VIEW', 'VIDEO_VIEW');

CREATE TABLE "QuizQuestionInteraction" (
  "id" TEXT NOT NULL,
  "type" "QuizQuestionInteractionType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attemptId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "analogySetId" TEXT,

  CONSTRAINT "QuizQuestionInteraction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuizQuestionInteraction_attemptId_idx" ON "QuizQuestionInteraction"("attemptId");
CREATE INDEX "QuizQuestionInteraction_questionId_idx" ON "QuizQuestionInteraction"("questionId");
CREATE INDEX "QuizQuestionInteraction_studentId_idx" ON "QuizQuestionInteraction"("studentId");
CREATE INDEX "QuizQuestionInteraction_type_idx" ON "QuizQuestionInteraction"("type");
CREATE INDEX "QuizQuestionInteraction_analogySetId_idx" ON "QuizQuestionInteraction"("analogySetId");

ALTER TABLE "QuizQuestionInteraction"
  ADD CONSTRAINT "QuizQuestionInteraction_attemptId_fkey"
  FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizQuestionInteraction"
  ADD CONSTRAINT "QuizQuestionInteraction_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizQuestionInteraction"
  ADD CONSTRAINT "QuizQuestionInteraction_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizQuestionInteraction"
  ADD CONSTRAINT "QuizQuestionInteraction_analogySetId_fkey"
  FOREIGN KEY ("analogySetId") REFERENCES "AnalogySet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Remove legacy short-answer quiz questions and their related responses.
DELETE FROM "QuizResponse"
WHERE "questionId" IN (
  SELECT id FROM "QuizQuestion" WHERE type = 'SHORT'
);

DELETE FROM "QuizQuestion"
WHERE type = 'SHORT';
