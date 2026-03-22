-- Create lecture table
CREATE TABLE "Lecture" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sourceType" TEXT,
  "sourceFilename" TEXT,
  "sourceText" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "moduleId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  CONSTRAINT "Lecture_pkey" PRIMARY KEY ("id")
);

-- Add lecture foreign key to analogy sets
ALTER TABLE "AnalogySet"
ADD COLUMN "lectureId" TEXT;

-- Indexes
CREATE INDEX "Lecture_moduleId_createdAt_idx" ON "Lecture"("moduleId", "createdAt");
CREATE INDEX "Lecture_ownerId_createdAt_idx" ON "Lecture"("ownerId", "createdAt");
CREATE INDEX "AnalogySet_lectureId_idx" ON "AnalogySet"("lectureId");

-- Foreign keys
ALTER TABLE "Lecture"
ADD CONSTRAINT "Lecture_moduleId_fkey"
FOREIGN KEY ("moduleId") REFERENCES "Module"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lecture"
ADD CONSTRAINT "Lecture_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AnalogySet"
ADD CONSTRAINT "AnalogySet_lectureId_fkey"
FOREIGN KEY ("lectureId") REFERENCES "Lecture"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
