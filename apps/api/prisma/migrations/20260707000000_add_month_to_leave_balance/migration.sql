-- DropIndex
DROP INDEX "leave_balances_employeeId_leaveType_year_key";

-- DropIndex
DROP INDEX "leave_balances_employeeId_year_idx";

-- AlterTable
ALTER TABLE "leave_balances" ADD COLUMN "month" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "leave_balances_employeeId_year_month_idx" ON "leave_balances"("employeeId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_employeeId_leaveType_year_month_key" ON "leave_balances"("employeeId", "leaveType", "year", "month");
