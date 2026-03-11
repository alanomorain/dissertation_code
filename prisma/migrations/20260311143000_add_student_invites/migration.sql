ALTER TABLE "User"
ADD COLUMN "inviteToken" TEXT,
ADD COLUMN "inviteExpires" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_inviteToken_key" ON "User"("inviteToken");
CREATE INDEX "User_inviteToken_idx" ON "User"("inviteToken");
