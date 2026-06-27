/*
  Warnings:

  - The `department` column on the `employees` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `recruitments` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `gender` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Department" AS ENUM ('ENGINEERING', 'OPERATIONS', 'SALES', 'FINANCE', 'HR', 'OTHER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('OFFER_SIGNED', 'ONBOARDING', 'ACTIVE', 'OFFBOARDING', 'TERMINATED');

-- CreateEnum
CREATE TYPE "JobPostingStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ApplicationStage" AS ENUM ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER_SENT', 'HIRED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "HrLetterType" AS ENUM ('OFFER', 'APPOINTMENT', 'EXPERIENCE', 'SALARY_CERTIFICATE', 'OTHER');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "terminatedAt" TIMESTAMP(3),
DROP COLUMN "department",
ADD COLUMN     "department" "Department";

-- DropTable
DROP TABLE "recruitments";

-- CreateTable
CREATE TABLE "job_postings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "status" "JobPostingStatus" NOT NULL DEFAULT 'DRAFT',
    "postedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "stage" "ApplicationStage" NOT NULL DEFAULT 'APPLIED',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stageChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interviewAt" TIMESTAMP(3),
    "offerSentAt" TIMESTAMP(3),
    "offerAcceptedAt" TIMESTAMP(3),
    "hiredAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_records" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startDate" DATE NOT NULL,
    "targetEndDate" DATE,
    "completedAt" TIMESTAMP(3),
    "checklist" JSONB,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_letters" (
    "id" TEXT NOT NULL,
    "type" "HrLetterType" NOT NULL,
    "employeeId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "generatedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_letters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_postings_status_idx" ON "job_postings"("status");

-- CreateIndex
CREATE INDEX "job_postings_department_idx" ON "job_postings"("department");

-- CreateIndex
CREATE INDEX "job_applications_jobPostingId_idx" ON "job_applications"("jobPostingId");

-- CreateIndex
CREATE INDEX "job_applications_stage_idx" ON "job_applications"("stage");

-- CreateIndex
CREATE INDEX "job_applications_appliedAt_idx" ON "job_applications"("appliedAt");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_records_employeeId_key" ON "onboarding_records"("employeeId");

-- CreateIndex
CREATE INDEX "onboarding_records_status_idx" ON "onboarding_records"("status");

-- CreateIndex
CREATE INDEX "onboarding_records_startDate_idx" ON "onboarding_records"("startDate");

-- CreateIndex
CREATE INDEX "hr_letters_employeeId_idx" ON "hr_letters"("employeeId");

-- CreateIndex
CREATE INDEX "employees_department_idx" ON "employees"("department");

-- CreateIndex
CREATE INDEX "employees_employmentStatus_idx" ON "employees"("employmentStatus");

-- CreateIndex
CREATE INDEX "employees_isActive_employmentStatus_idx" ON "employees"("isActive", "employmentStatus");

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_records" ADD CONSTRAINT "onboarding_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_records" ADD CONSTRAINT "onboarding_records_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_letters" ADD CONSTRAINT "hr_letters_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_letters" ADD CONSTRAINT "hr_letters_generatedByUserId_fkey" FOREIGN KEY ("generatedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
