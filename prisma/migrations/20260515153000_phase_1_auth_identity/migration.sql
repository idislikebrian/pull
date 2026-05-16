-- Phase 1 identity/auth infrastructure.
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "OnboardingStatus" AS ENUM ('HANDLE_ASSIGNED', 'COMPLETE');
CREATE TYPE "IdentityProvider" AS ENUM ('PRIVY_PHONE', 'PRIVY_EMAIL', 'PRIVY_WALLET', 'PRIVY_PASSKEY', 'PRIVY_SOCIAL');

ALTER TABLE "User" RENAME COLUMN "username" TO "handle";

ALTER TABLE "User"
  ALTER COLUMN "email" DROP NOT NULL,
  ADD COLUMN "privyUserId" TEXT,
  ADD COLUMN "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'HANDLE_ASSIGNED',
  ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "isLegacyPlaceholder" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "handleCustomizedAt" TIMESTAMP(3),
  ADD COLUMN "lastLoginAt" TIMESTAMP(3);

UPDATE "User"
SET "isLegacyPlaceholder" = true
WHERE "email" IN ('fan@pull.local', 'organizer@pull.local')
  OR "email" LIKE 'fan%@pull.local';

CREATE UNIQUE INDEX "User_privyUserId_key" ON "User"("privyUserId");

CREATE TABLE "IdentityAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" "IdentityProvider" NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "normalizedValue" TEXT,
  "displayValue" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "IdentityAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IdentityAccount_provider_providerAccountId_key" ON "IdentityAccount"("provider", "providerAccountId");
CREATE INDEX "IdentityAccount_userId_idx" ON "IdentityAccount"("userId");

ALTER TABLE "IdentityAccount"
  ADD CONSTRAINT "IdentityAccount_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "campaignId"
      ORDER BY
        CASE WHEN "type" = 'HARD' THEN 0 ELSE 1 END,
        "amount" DESC,
        "createdAt" ASC,
        "id" ASC
    ) AS keep_rank
  FROM "Pledge"
)
DELETE FROM "Pledge"
USING ranked
WHERE "Pledge"."id" = ranked."id"
  AND ranked.keep_rank > 1;

CREATE UNIQUE INDEX "Pledge_userId_campaignId_key" ON "Pledge"("userId", "campaignId");
