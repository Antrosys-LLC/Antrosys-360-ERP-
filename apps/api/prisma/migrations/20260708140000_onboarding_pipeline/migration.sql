-- CreateEnum
CREATE TYPE "OnboardingPhase" AS ENUM ('PENDING', 'DOCUMENTATION', 'IT_SETUP', 'HR_ORIENTATION', 'TEAM_INTRO', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OnboardingMeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "onboarding_records" ADD COLUMN "currentPhase" "OnboardingPhase" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "employee_tasks" ADD COLUMN "phase" "OnboardingPhase";

-- CreateTable
CREATE TABLE "onboarding_meetings" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 30,
    "location" TEXT,
    "phase" "OnboardingPhase",
    "status" "OnboardingMeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "onboarding_meetings_employeeId_idx" ON "onboarding_meetings"("employeeId");

-- CreateIndex
CREATE INDEX "onboarding_meetings_scheduledAt_idx" ON "onboarding_meetings"("scheduledAt");

-- CreateIndex
CREATE INDEX "onboarding_records_currentPhase_idx" ON "onboarding_records"("currentPhase");

-- AddForeignKey
ALTER TABLE "onboarding_meetings" ADD CONSTRAINT "onboarding_meetings_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_meetings" ADD CONSTRAINT "onboarding_meetings_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
