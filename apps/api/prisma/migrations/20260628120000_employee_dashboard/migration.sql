-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'HALF_DAY');
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'OTHER');
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- Attendance: add columns and convert status
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "checkInLocation" TEXT;
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "overtimeHours" DECIMAL(4,2);

ALTER TABLE "attendances" ADD COLUMN "status_new" "AttendanceStatus";
UPDATE "attendances" SET "status_new" = CASE
  WHEN UPPER("status") IN ('PRESENT') THEN 'PRESENT'::"AttendanceStatus"
  WHEN UPPER("status") IN ('ABSENT') THEN 'ABSENT'::"AttendanceStatus"
  WHEN UPPER("status") IN ('LATE') THEN 'LATE'::"AttendanceStatus"
  WHEN UPPER("status") IN ('LEAVE', 'ON LEAVE') THEN 'LEAVE'::"AttendanceStatus"
  WHEN UPPER("status") IN ('HALF_DAY', 'HALF DAY', 'HALF-DAY') THEN 'HALF_DAY'::"AttendanceStatus"
  ELSE 'ABSENT'::"AttendanceStatus"
END;
ALTER TABLE "attendances" DROP COLUMN "status";
ALTER TABLE "attendances" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "attendances" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "attendances" ALTER COLUMN "status" SET DEFAULT 'ABSENT';

-- Leave requests: convert type and status
ALTER TABLE "leave_requests" ADD COLUMN "type_new" "LeaveType";
UPDATE "leave_requests" SET "type_new" = CASE
  WHEN UPPER("type") LIKE '%ANNUAL%' THEN 'ANNUAL'::"LeaveType"
  WHEN UPPER("type") LIKE '%SICK%' THEN 'SICK'::"LeaveType"
  WHEN UPPER("type") LIKE '%CASUAL%' THEN 'CASUAL'::"LeaveType"
  WHEN UPPER("type") LIKE '%MATERNITY%' THEN 'MATERNITY'::"LeaveType"
  ELSE 'OTHER'::"LeaveType"
END;
ALTER TABLE "leave_requests" DROP COLUMN "type";
ALTER TABLE "leave_requests" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "leave_requests" ALTER COLUMN "type" SET NOT NULL;

ALTER TABLE "leave_requests" ADD COLUMN "status_new" "LeaveRequestStatus";
UPDATE "leave_requests" SET "status_new" = CASE
  WHEN UPPER("status") = 'APPROVED' THEN 'APPROVED'::"LeaveRequestStatus"
  WHEN UPPER("status") = 'REJECTED' THEN 'REJECTED'::"LeaveRequestStatus"
  WHEN UPPER("status") = 'CANCELLED' THEN 'CANCELLED'::"LeaveRequestStatus"
  ELSE 'PENDING'::"LeaveRequestStatus"
END;
ALTER TABLE "leave_requests" DROP COLUMN "status";
ALTER TABLE "leave_requests" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "leave_requests" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "leave_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Announcements: department scope
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "department" "Department";
CREATE INDEX IF NOT EXISTS "announcements_department_idx" ON "announcements"("department");

-- Leave balances
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "year" INTEGER NOT NULL,
    "allocatedDays" DECIMAL(5,1) NOT NULL,
    "usedDays" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "pendingDays" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "leave_balances_employeeId_leaveType_year_key" ON "leave_balances"("employeeId", "leaveType", "year");
CREATE INDEX "leave_balances_employeeId_year_idx" ON "leave_balances"("employeeId", "year");
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Employee payslips
CREATE TABLE "employee_payslips" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payrollId" TEXT,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "grossPay" DECIMAL(14,2) NOT NULL,
    "netPay" DECIMAL(14,2) NOT NULL,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "deductionsTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netPayRatioPct" INTEGER NOT NULL DEFAULT 78,
    "documentUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_payslips_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "employee_payslips_employeeId_periodStart_idx" ON "employee_payslips"("employeeId", "periodStart");
ALTER TABLE "employee_payslips" ADD CONSTRAINT "employee_payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Company holidays
CREATE TABLE "company_holidays" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "endDate" DATE,
    "location" TEXT,
    "isNational" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_holidays_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "company_holidays_date_idx" ON "company_holidays"("date");

-- Work schedule config (admin-tunable standard hours)
CREATE TABLE "work_schedule_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "standardHoursPerDay" DECIMAL(4,2) NOT NULL DEFAULT 8,
    "halfDayThresholdHours" DECIMAL(4,2) NOT NULL DEFAULT 4,
    "overtimeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lateAfterHour" INTEGER NOT NULL DEFAULT 9,
    "lateAfterMinute" INTEGER NOT NULL DEFAULT 0,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_schedule_config_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "work_schedule_config" ADD CONSTRAINT "work_schedule_config_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "work_schedule_config" ("id", "updatedAt")
VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Recreate status index after enum column replacement (dropped with old status column)
CREATE INDEX IF NOT EXISTS "leave_requests_status_idx" ON "leave_requests"("status");
