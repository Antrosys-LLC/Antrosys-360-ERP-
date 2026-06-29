-- Extend employee payslips (table already exists from employee_dashboard migration)
DO $$ BEGIN
  CREATE TYPE "PayslipStatus" AS ENUM ('PROCESSING', 'PAID', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "employee_payslips" ADD COLUMN IF NOT EXISTS "status" "PayslipStatus" NOT NULL DEFAULT 'PROCESSING';

CREATE UNIQUE INDEX IF NOT EXISTS "employee_payslips_employeeId_periodStart_key" ON "employee_payslips"("employeeId", "periodStart");
