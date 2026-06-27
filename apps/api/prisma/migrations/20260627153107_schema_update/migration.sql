/*
  Warnings:

  - You are about to drop the `recruitments` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED');

-- DropTable
DROP TABLE "recruitments";

-- CreateTable
CREATE TABLE "job_requisitions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "jobRequisitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "experience" TEXT,
    "rating" DECIMAL(3,2),
    "ratingType" TEXT NOT NULL DEFAULT 'default',
    "filesCount" INTEGER NOT NULL DEFAULT 0,
    "tag" TEXT,
    "tagColor" TEXT,
    "pipelineStage" "PipelineStage" NOT NULL DEFAULT 'APPLIED',
    "pipelineProgress" INTEGER NOT NULL DEFAULT 1,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interviewTitle" TEXT,
    "interviewLocation" TEXT,
    "interviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "candidates_pipelineStage_idx" ON "candidates"("pipelineStage");

-- CreateIndex
CREATE INDEX "candidates_jobRequisitionId_idx" ON "candidates"("jobRequisitionId");

-- AddForeignKey
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_jobRequisitionId_fkey" FOREIGN KEY ("jobRequisitionId") REFERENCES "job_requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
