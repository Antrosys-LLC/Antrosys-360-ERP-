-- CreateEnum
CREATE TYPE "PayrollLifecycleStep" AS ENUM ('DATA_COLLECTION', 'REVIEW_VERIFY', 'PAYROLL_RUN', 'CFO_APPROVAL', 'DISBURSEMENT');

-- CreateEnum
CREATE TYPE "PayrollLineStatus" AS ENUM ('PENDING', 'PROCESSING', 'ON_HOLD', 'VERIFIED');

-- AlterTable
ALTER TABLE "payrolls" ADD COLUMN "totalDeductions" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "payrolls" ADD COLUMN "employerLiability" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "payrolls" ADD COLUMN "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'PKR';
ALTER TABLE "payrolls" ADD COLUMN "lifecycleStep" "PayrollLifecycleStep" NOT NULL DEFAULT 'DATA_COLLECTION';
ALTER TABLE "payrolls" ADD COLUMN "payslipConfig" JSONB;
ALTER TABLE "payrolls" ADD COLUMN "generationProgress" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "employee_compensations" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "baseSalary" DECIMAL(14,2) NOT NULL,
    "allowances" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'PKR',
    "effectiveFrom" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_compensations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_line_items" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "baseSalary" DECIMAL(14,2) NOT NULL,
    "allowances" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "overtime" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "bonuses" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "grossPay" DECIMAL(14,2) NOT NULL,
    "incomeTax" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "providentFund" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "healthInsurance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "deductionsTotal" DECIMAL(14,2) NOT NULL,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(14,2) NOT NULL,
    "status" "PayrollLineStatus" NOT NULL DEFAULT 'PENDING',
    "holdReason" TEXT,
    "payslipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_compensations_employeeId_key" ON "employee_compensations"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_line_items_payslipId_key" ON "payroll_line_items"("payslipId");

-- CreateIndex
CREATE INDEX "payroll_line_items_payrollId_status_idx" ON "payroll_line_items"("payrollId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_line_items_payrollId_employeeId_key" ON "payroll_line_items"("payrollId", "employeeId");

-- AddForeignKey
ALTER TABLE "employee_compensations" ADD CONSTRAINT "employee_compensations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_line_items" ADD CONSTRAINT "payroll_line_items_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "payrolls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_line_items" ADD CONSTRAINT "payroll_line_items_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_payslips" ADD CONSTRAINT "employee_payslips_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "payrolls"("id") ON DELETE SET NULL ON UPDATE CASCADE;
