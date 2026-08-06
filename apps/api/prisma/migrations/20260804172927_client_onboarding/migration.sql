-- CreateEnum
CREATE TYPE "ClientOnboardingPhase" AS ENUM ('KICKOFF', 'SETUP', 'HANDBACK', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ClientOnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');

-- AlterEnum
ALTER TYPE "ClientPipelineStage" ADD VALUE 'ONBOARDING';

-- CreateTable
CREATE TABLE "client_onboardings" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "ClientOnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "currentPhase" "ClientOnboardingPhase" NOT NULL DEFAULT 'KICKOFF',
    "startDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "assignedToUserId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_onboardings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_onboarding_items" (
    "id" TEXT NOT NULL,
    "onboardingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'KICKOFF',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_onboarding_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_onboardings_clientId_key" ON "client_onboardings"("clientId");

-- CreateIndex
CREATE INDEX "client_onboardings_status_idx" ON "client_onboardings"("status");

-- CreateIndex
CREATE INDEX "client_onboardings_currentPhase_idx" ON "client_onboardings"("currentPhase");

-- CreateIndex
CREATE INDEX "client_onboarding_items_onboardingId_idx" ON "client_onboarding_items"("onboardingId");

-- CreateIndex
CREATE INDEX "client_onboarding_items_category_idx" ON "client_onboarding_items"("category");

-- AddForeignKey
ALTER TABLE "client_onboardings" ADD CONSTRAINT "client_onboardings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_onboardings" ADD CONSTRAINT "client_onboardings_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_onboardings" ADD CONSTRAINT "client_onboardings_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_onboarding_items" ADD CONSTRAINT "client_onboarding_items_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "client_onboardings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
