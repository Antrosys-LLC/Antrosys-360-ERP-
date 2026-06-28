/*
  Warnings:

  - The `status` column on the `leave_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `leave_requests` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'CASUAL', 'WFH', 'UNPAID');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "declineNote" TEXT,
ALTER COLUMN "endDate" SET DATA TYPE DATE,
ALTER COLUMN "startDate" SET DATA TYPE DATE,
DROP COLUMN "status",
ADD COLUMN     "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
DROP COLUMN "type",
ADD COLUMN     "type" "LeaveType" NOT NULL;

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "type" "LeaveType" NOT NULL,
    "totalDays" INTEGER NOT NULL DEFAULT 0,
    "takenDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leave_balances_employeeId_year_idx" ON "leave_balances"("employeeId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_employeeId_year_type_key" ON "leave_balances"("employeeId", "year", "type");

-- CreateIndex
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");

-- CreateIndex
CREATE INDEX "leave_requests_startDate_idx" ON "leave_requests"("startDate");

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
