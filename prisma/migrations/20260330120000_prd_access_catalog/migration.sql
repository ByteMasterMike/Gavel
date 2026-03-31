-- CreateTable
CREATE TABLE "DlcPack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DlcPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDlcEntitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDlcEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LlmUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rulingId" TEXT,
    "callType" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LlmUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DlcPack_slug_key" ON "DlcPack"("slug");

-- CreateIndex
CREATE INDEX "UserDlcEntitlement_userId_idx" ON "UserDlcEntitlement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDlcEntitlement_userId_packId_key" ON "UserDlcEntitlement"("userId", "packId");

-- CreateIndex
CREATE INDEX "LlmUsageLog_userId_createdAt_idx" ON "LlmUsageLog"("userId", "createdAt");

-- AlterTable
ALTER TABLE "Case" ADD COLUMN "dlcPackId" TEXT;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_dlcPackId_fkey" FOREIGN KEY ("dlcPackId") REFERENCES "DlcPack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDlcEntitlement" ADD CONSTRAINT "UserDlcEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDlcEntitlement" ADD CONSTRAINT "UserDlcEntitlement_packId_fkey" FOREIGN KEY ("packId") REFERENCES "DlcPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LlmUsageLog" ADD CONSTRAINT "LlmUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
