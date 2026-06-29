-- CreateEnum
CREATE TYPE "PayslipStatus" AS ENUM ('PROCESSING', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "employee_payslips" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "periodMonth" DATE NOT NULL,
    "grossAmount" DECIMAL(14,2) NOT NULL,
    "deductionsAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(14,2) NOT NULL,
    "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'PKR',
    "status" "PayslipStatus" NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_payslips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_payslips_employeeId_idx" ON "employee_payslips"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_payslips_employeeId_periodMonth_key" ON "employee_payslips"("employeeId", "periodMonth");

-- AddForeignKey
ALTER TABLE "employee_payslips" ADD CONSTRAINT "employee_payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
