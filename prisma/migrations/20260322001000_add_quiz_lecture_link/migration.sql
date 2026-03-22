ALTER TABLE "Quiz"
ADD COLUMN IF NOT EXISTS "lectureId" TEXT;

CREATE INDEX IF NOT EXISTS "Quiz_lectureId_idx" ON "Quiz"("lectureId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Quiz_lectureId_fkey'
  ) THEN
    ALTER TABLE "Quiz"
    ADD CONSTRAINT "Quiz_lectureId_fkey"
    FOREIGN KEY ("lectureId") REFERENCES "Lecture"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
