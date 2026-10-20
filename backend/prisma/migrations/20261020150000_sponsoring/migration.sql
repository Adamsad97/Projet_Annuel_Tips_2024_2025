-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "AdAudience" AS ENUM ('ALL', 'MEMBERS', 'GUESTS');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CHALLENGE';

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sponsorName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "targetUrl" TEXT NOT NULL,
    "status" "AdStatus" NOT NULL DEFAULT 'DRAFT',
    "audience" "AdAudience" NOT NULL DEFAULT 'ALL',
    "targetCategoryIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "targetGradeIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "maxImpressions" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdDailyStat" (
    "campaignId" INTEGER NOT NULL,
    "day" DATE NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AdDailyStat_pkey" PRIMARY KEY ("campaignId","day")
);

-- CreateTable
CREATE TABLE "SponsoredChallenge" (
    "id" SERIAL NOT NULL,
    "sponsorName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "xpBonus" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "maxRewards" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" INTEGER,

    CONSTRAINT "SponsoredChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeReward" (
    "id" SERIAL NOT NULL,
    "xp" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "challengeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "tipId" INTEGER NOT NULL,

    CONSTRAINT "ChallengeReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdCampaign_status_startsAt_idx" ON "AdCampaign"("status", "startsAt");

-- CreateIndex
CREATE INDEX "SponsoredChallenge_isActive_startsAt_endsAt_idx" ON "SponsoredChallenge"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeReward_challengeId_userId_key" ON "ChallengeReward"("challengeId", "userId");

-- AddForeignKey
ALTER TABLE "AdDailyStat" ADD CONSTRAINT "AdDailyStat_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsoredChallenge" ADD CONSTRAINT "SponsoredChallenge_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsoredChallenge" ADD CONSTRAINT "SponsoredChallenge_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeReward" ADD CONSTRAINT "ChallengeReward_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "SponsoredChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeReward" ADD CONSTRAINT "ChallengeReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeReward" ADD CONSTRAINT "ChallengeReward_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "Tip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
