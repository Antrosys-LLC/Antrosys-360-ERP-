-- CreateEnum
CREATE TYPE "KpiStatus" AS ENUM ('ON_TRACK', 'AT_RISK', 'OFF_TRACK', 'EXCEEDED');

-- CreateTable
CREATE TABLE "kpis" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "department" "Department",
    "ownerEmployeeId" TEXT,
    "unit" TEXT,
    "targetValue" DECIMAL(12,2),
    "currentValue" DECIMAL(12,2),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "KpiStatus" NOT NULL DEFAULT 'ON_TRACK',
    "trend" JSONB,
    "quarter" TEXT,
    "year" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kpis_status_idx" ON "kpis"("status");

-- CreateIndex
CREATE INDEX "kpis_department_idx" ON "kpis"("department");

-- CreateIndex
CREATE INDEX "kpis_quarter_year_idx" ON "kpis"("quarter", "year");

-- AddForeignKey
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_ownerEmployeeId_fkey" FOREIGN KEY ("ownerEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
