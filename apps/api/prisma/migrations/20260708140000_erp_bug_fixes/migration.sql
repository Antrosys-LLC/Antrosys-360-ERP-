-- CreateEnum
CREATE TYPE "ManpowerRequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'FULFILLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DailyMood" AS ENUM ('HAPPY', 'NEUTRAL', 'STRESSED');

-- AlterTable
ALTER TABLE "company_holidays" ADD COLUMN "teamId" TEXT;

-- CreateTable
CREATE TABLE "manpower_requests" (
    "id" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "additionalHeadcount" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "ManpowerRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manpower_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_daily_moods" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mood" "DailyMood" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_daily_moods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_holidays_teamId_idx" ON "company_holidays"("teamId");

-- CreateIndex
CREATE INDEX "manpower_requests_department_idx" ON "manpower_requests"("department");

-- CreateIndex
CREATE INDEX "manpower_requests_status_idx" ON "manpower_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "employee_daily_moods_employeeId_date_key" ON "employee_daily_moods"("employeeId", "date");

-- CreateIndex
CREATE INDEX "employee_daily_moods_date_idx" ON "employee_daily_moods"("date");

-- AddForeignKey
ALTER TABLE "company_holidays" ADD CONSTRAINT "company_holidays_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manpower_requests" ADD CONSTRAINT "manpower_requests_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_daily_moods" ADD CONSTRAINT "employee_daily_moods_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
