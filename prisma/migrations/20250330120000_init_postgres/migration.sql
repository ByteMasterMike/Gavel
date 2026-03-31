-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CaseKind" AS ENUM ('CRIMINAL', 'CIVIL');

-- CreateEnum
CREATE TYPE "RulingStatus" AS ENUM ('PENDING', 'SCORED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "careerPoints" INTEGER NOT NULL DEFAULT 0,
    "currentTier" INTEGER NOT NULL DEFAULT 1,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "kind" "CaseKind" NOT NULL,
    "category" TEXT NOT NULL,
    "briefSummary" TEXT NOT NULL,
    "parTimeMinutes" INTEGER NOT NULL,
    "correctVerdict" TEXT NOT NULL,
    "correctSentenceText" TEXT NOT NULL,
    "correctSentenceNumeric" DOUBLE PRECISION,
    "correctReasoningSummary" TEXT NOT NULL,
    "actualOpinionExcerpt" TEXT NOT NULL,
    "isOverturned" BOOLEAN NOT NULL DEFAULT false,
    "appellateReversalSummary" TEXT,
    "whyExplanation" TEXT NOT NULL,
    "maxPrecedents" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseDocument" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isAdmissible" BOOLEAN NOT NULL DEFAULT true,
    "isMaterial" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Precedent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "citation" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRelevant" BOOLEAN NOT NULL DEFAULT false,
    "weightMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "Precedent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRuling" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "sentenceText" TEXT NOT NULL,
    "sentenceNumeric" DOUBLE PRECISION,
    "findingsOfFact" TEXT NOT NULL,
    "applicationOfLaw" TEXT NOT NULL,
    "mitigatingFactors" TEXT NOT NULL,
    "flaggedDocIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "starredDocIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "citedPrecedentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "openedDocIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "verdictFlips" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "accuracyScore" INTEGER,
    "styleScore" INTEGER,
    "totalScore" INTEGER,
    "llmScoreRaw" DOUBLE PRECISION,
    "llmFeedback" TEXT,
    "scoreBreakdown" JSONB,
    "judgeRank" TEXT,
    "judgeRankDescription" TEXT,
    "status" "RulingStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "UserRuling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "caseId" TEXT NOT NULL,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "CaseDocument_caseId_idx" ON "CaseDocument"("caseId");

-- CreateIndex
CREATE INDEX "Precedent_caseId_idx" ON "Precedent"("caseId");

-- CreateIndex
CREATE INDEX "UserRuling_userId_idx" ON "UserRuling"("userId");

-- CreateIndex
CREATE INDEX "UserRuling_caseId_idx" ON "UserRuling"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_date_key" ON "DailyChallenge"("date");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDocument" ADD CONSTRAINT "CaseDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Precedent" ADD CONSTRAINT "Precedent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRuling" ADD CONSTRAINT "UserRuling_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRuling" ADD CONSTRAINT "UserRuling_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallenge" ADD CONSTRAINT "DailyChallenge_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
