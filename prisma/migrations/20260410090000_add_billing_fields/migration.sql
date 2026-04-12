ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "lemonSqueezyCustomerId" TEXT,
ADD COLUMN IF NOT EXISTS "lemonSqueezyOrderId" TEXT,
ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT,
ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT,
ADD COLUMN IF NOT EXISTS "subscriptionRenewsAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_lemonSqueezyCustomerId_key"
ON "User"("lemonSqueezyCustomerId");

CREATE UNIQUE INDEX IF NOT EXISTS "User_subscriptionId_key"
ON "User"("subscriptionId");
