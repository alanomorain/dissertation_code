-- CreateTable
CREATE TABLE "AnalogySet" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "ownerRole" TEXT NOT NULL DEFAULT 'lecturer',
    "title" TEXT,
    "source" TEXT,
    "sourceText" TEXT,
    "topicsJson" JSONB,
    "errorMessage" TEXT,

    CONSTRAINT "AnalogySet_pkey" PRIMARY KEY ("id")
);
