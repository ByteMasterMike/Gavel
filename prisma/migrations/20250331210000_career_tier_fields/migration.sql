-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastMorningDocketLocalDate" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "tierAccuracyWarning" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "rulingsSinceTierWarning" INTEGER NOT NULL DEFAULT 0;
