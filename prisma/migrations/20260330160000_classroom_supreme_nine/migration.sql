-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('LEARNER', 'INSTRUCTOR');

-- CreateEnum
CREATE TYPE "DissentStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ClassroomBadgeKind" AS ENUM ('DISTINGUISHED_DISSENTER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'LEARNER';

-- AlterTable
ALTER TABLE "UserRuling" ADD COLUMN "sessionId" TEXT;

-- CreateTable
CREATE TABLE "SupremeNineSeat" (
    "slot" INTEGER NOT NULL,
    "userId" TEXT,
    "careerPointsSnapshot" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupremeNineSeat_pkey" PRIMARY KEY ("slot")
);

-- CreateTable
CREATE TABLE "ClassSession" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "anonymousDisplayName" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dissent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" "DissentStatus" NOT NULL DEFAULT 'PENDING',
    "instructorComment" TEXT,

    CONSTRAINT "Dissent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassroomBadgeGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "kind" "ClassroomBadgeKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassroomBadgeGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupremeNineSeat_userId_key" ON "SupremeNineSeat"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSession_roomCode_key" ON "ClassSession"("roomCode");

-- CreateIndex
CREATE INDEX "ClassSession_instructorId_idx" ON "ClassSession"("instructorId");

-- CreateIndex
CREATE INDEX "ClassSession_caseId_idx" ON "ClassSession"("caseId");

-- CreateIndex
CREATE INDEX "SessionParticipant_sessionId_idx" ON "SessionParticipant"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionParticipant_sessionId_userId_key" ON "SessionParticipant"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "Dissent_sessionId_idx" ON "Dissent"("sessionId");

-- CreateIndex
CREATE INDEX "Dissent_userId_idx" ON "Dissent"("userId");

-- CreateIndex
CREATE INDEX "ClassroomBadgeGrant_userId_idx" ON "ClassroomBadgeGrant"("userId");

-- CreateIndex
CREATE INDEX "ClassroomBadgeGrant_sessionId_idx" ON "ClassroomBadgeGrant"("sessionId");

-- CreateIndex
CREATE INDEX "UserRuling_sessionId_idx" ON "UserRuling"("sessionId");

-- AddForeignKey
ALTER TABLE "SupremeNineSeat" ADD CONSTRAINT "SupremeNineSeat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dissent" ADD CONSTRAINT "Dissent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dissent" ADD CONSTRAINT "Dissent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomBadgeGrant" ADD CONSTRAINT "ClassroomBadgeGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomBadgeGrant" ADD CONSTRAINT "ClassroomBadgeGrant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRuling" ADD CONSTRAINT "UserRuling_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
