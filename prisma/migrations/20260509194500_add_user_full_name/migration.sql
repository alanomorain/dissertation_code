ALTER TABLE "User" ADD COLUMN "fullName" TEXT;

UPDATE "User" SET "fullName" = 'Sam Taylor' WHERE email = 's@example.com';
UPDATE "User" SET "fullName" = 'Aisha Morgan' WHERE email = 'student2@example.com';
UPDATE "User" SET "fullName" = 'Daniel Hughes' WHERE email = 'student3@example.com';
UPDATE "User" SET "fullName" = 'Niamh O Connor' WHERE email = 'student4@example.com';
