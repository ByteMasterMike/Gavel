-- Subscription access replaces DLC packs (drops DLC tables/column if present).

DROP TABLE IF EXISTS "UserDlcEntitlement";

ALTER TABLE "Case" DROP CONSTRAINT IF EXISTS "Case_dlcPackId_fkey";
ALTER TABLE "Case" DROP COLUMN IF EXISTS "dlcPackId";

DROP TABLE IF EXISTS "DlcPack";

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'ACTIVE', 'PAST_DUE', 'CANCELED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'NONE'::"SubscriptionStatus";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionValidUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;

ALTER TABLE "Case" ADD COLUMN IF NOT EXISTS "requiresSubscription" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "LlmUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rulingId" TEXT,
    "callType" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LlmUsageLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LlmUsageLog_userId_createdAt_idx" ON "LlmUsageLog"("userId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "LlmUsageLog" ADD CONSTRAINT "LlmUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
