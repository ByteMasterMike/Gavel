-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "appellateSeat" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ClassSession" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SupremeNineSeat" ALTER COLUMN "updatedAt" DROP DEFAULT;
