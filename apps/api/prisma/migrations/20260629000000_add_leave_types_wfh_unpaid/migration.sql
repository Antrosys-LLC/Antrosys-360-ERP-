-- AlterEnum
-- Adds the WFH and UNPAID leave types from the leave backend feature on top of
-- the existing LeaveType enum created by the employee_dashboard migration.
ALTER TYPE "LeaveType" ADD VALUE IF NOT EXISTS 'WFH';
ALTER TYPE "LeaveType" ADD VALUE IF NOT EXISTS 'UNPAID';

-- AlterTable
-- declineNote was previously added by the removed branch migration; restore it here.
ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "declineNote" TEXT;
