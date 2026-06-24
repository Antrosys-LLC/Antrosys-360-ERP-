-- Align CFO tables with schema.prisma required columns.
-- The prior migration added nullable columns for safe rollout on stub rows;
-- this migration clears stub data and enforces NOT NULL constraints.

DELETE FROM "invoices";
DELETE FROM "payrolls";
DELETE FROM "clients";

ALTER TABLE "invoices" ALTER COLUMN "invoiceNumber" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "clientId" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "invoiceDate" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "dueDate" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "subtotal" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "taxableAmount" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "totalDue" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "issuedByUserId" SET NOT NULL;

ALTER TABLE "payrolls" ALTER COLUMN "batchNumber" SET NOT NULL;
ALTER TABLE "payrolls" ALTER COLUMN "periodStart" SET NOT NULL;
ALTER TABLE "payrolls" ALTER COLUMN "periodEnd" SET NOT NULL;
ALTER TABLE "payrolls" ALTER COLUMN "totalGross" SET NOT NULL;
ALTER TABLE "payrolls" ALTER COLUMN "totalNet" SET NOT NULL;
ALTER TABLE "payrolls" ALTER COLUMN "employeeCount" SET NOT NULL;
