-- AlterEnum
ALTER TYPE "LeaveRequestStatus" ADD VALUE IF NOT EXISTS 'PENDING_OPS_HEAD';

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN "requiresOpsHeadApproval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "leave_requests" ADD COLUMN "managerApprovedById" TEXT;
ALTER TABLE "leave_requests" ADD COLUMN "managerApprovedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "leave_requests_requiresOpsHeadApproval_idx" ON "leave_requests"("requiresOpsHeadApproval");

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_managerApprovedById_fkey" FOREIGN KEY ("managerApprovedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "department_headcount_plans" (
    "id" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "targetHeadcount" INTEGER NOT NULL,
    "criticalGapThreshold" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_headcount_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roster_day_coverages" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "department" "Department",
    "requiredStaff" INTEGER NOT NULL,
    "assignedStaff" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roster_day_coverages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "department_headcount_plans_department_key" ON "department_headcount_plans"("department");

-- CreateIndex
CREATE INDEX "roster_day_coverages_date_idx" ON "roster_day_coverages"("date");

-- CreateIndex
CREATE UNIQUE INDEX "roster_day_coverages_date_department_key" ON "roster_day_coverages"("date", "department");
