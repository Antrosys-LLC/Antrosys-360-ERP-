/*
  Warnings:

  - A unique constraint covering the columns `[employeeId,date]` on the table `attendances` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `authorId` to the `announcements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `announcements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `announcements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `attendances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeId` to the `attendances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `attendances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationDays` to the `leave_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeId` to the `leave_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `leave_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `leave_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `leave_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `leave_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUB_MANAGER';

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "authorId" TEXT NOT NULL,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "checkIn" TIMESTAMP(3),
ADD COLUMN     "checkOut" TIMESTAMP(3),
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "employeeId" TEXT NOT NULL,
ADD COLUMN     "hours" DECIMAL(4,2),
ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "durationDays" INTEGER NOT NULL,
ADD COLUMN     "employeeId" TEXT NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "team_mood_pulses" (
    "id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "happy" INTEGER NOT NULL DEFAULT 0,
    "neutral" INTEGER NOT NULL DEFAULT 0,
    "stressed" INTEGER NOT NULL DEFAULT 0,
    "unknown" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_mood_pulses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_kpis" (
    "id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "sprintVelocity" INTEGER NOT NULL DEFAULT 84,
    "bugResolution" INTEGER NOT NULL DEFAULT 72,
    "codeReview" INTEGER NOT NULL DEFAULT 78,
    "deliveryOnTime" INTEGER NOT NULL DEFAULT 91,
    "teamUtilization" INTEGER NOT NULL DEFAULT 82,
    "openTickets" INTEGER NOT NULL DEFAULT 64,
    "documentation" INTEGER NOT NULL DEFAULT 48,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_mood_pulses_department_date_key" ON "team_mood_pulses"("department", "date");

-- CreateIndex
CREATE UNIQUE INDEX "department_kpis_department_key" ON "department_kpis"("department");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "announcements_authorId_idx" ON "announcements"("authorId");

-- CreateIndex
CREATE INDEX "attendances_employeeId_idx" ON "attendances"("employeeId");

-- CreateIndex
CREATE INDEX "attendances_date_idx" ON "attendances"("date");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_employeeId_date_key" ON "attendances"("employeeId", "date");

-- CreateIndex
CREATE INDEX "leave_requests_employeeId_idx" ON "leave_requests"("employeeId");

-- CreateIndex
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
