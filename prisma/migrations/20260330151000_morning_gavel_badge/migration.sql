CREATE TABLE "MorningGavelBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localDateYmd" TEXT NOT NULL,
    "timeZoneUsed" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MorningGavelBadge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MorningGavelBadge_userId_localDateYmd_caseId_key" ON "MorningGavelBadge"("userId", "localDateYmd", "caseId");

CREATE INDEX "MorningGavelBadge_userId_idx" ON "MorningGavelBadge"("userId");

ALTER TABLE "MorningGavelBadge" ADD CONSTRAINT "MorningGavelBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
