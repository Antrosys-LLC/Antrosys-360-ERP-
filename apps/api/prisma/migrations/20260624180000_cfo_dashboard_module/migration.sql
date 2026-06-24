-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalTaskStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ApprovalEntityType" AS ENUM ('PAYROLL', 'VENDOR_EXPENSE', 'INVOICE');

-- CreateEnum
CREATE TYPE "FinancialActivityCategory" AS ENUM ('ACCOUNTS_PAYABLE', 'PAYROLL', 'INVOICE', 'TAX');

-- CreateEnum
CREATE TYPE "VendorPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- AlterTable clients
ALTER TABLE "clients" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Unknown Client';
ALTER TABLE "clients" ADD COLUMN "email" TEXT;
ALTER TABLE "clients" ADD COLUMN "phone" TEXT;
ALTER TABLE "clients" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "clients" ALTER COLUMN "name" DROP DEFAULT;

-- AlterTable invoices
ALTER TABLE "invoices" ADD COLUMN "invoiceNumber" TEXT;
ALTER TABLE "invoices" ADD COLUMN "clientId" TEXT;
ALTER TABLE "invoices" ADD COLUMN "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "invoices" ADD COLUMN "invoiceDate" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN "dueDate" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN "paymentTermsDays" INTEGER NOT NULL DEFAULT 15;
ALTER TABLE "invoices" ADD COLUMN "poNumber" TEXT;
ALTER TABLE "invoices" ADD COLUMN "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'USD';
ALTER TABLE "invoices" ADD COLUMN "taxRegion" TEXT;
ALTER TABLE "invoices" ADD COLUMN "notes" TEXT;
ALTER TABLE "invoices" ADD COLUMN "terms" TEXT;
ALTER TABLE "invoices" ADD COLUMN "stripePaymentLink" TEXT;
ALTER TABLE "invoices" ADD COLUMN "subtotal" DECIMAL(14,2);
ALTER TABLE "invoices" ADD COLUMN "discountTotal" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN "taxableAmount" DECIMAL(14,2);
ALTER TABLE "invoices" ADD COLUMN "taxTotal" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN "withholdingTotal" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN "totalDue" DECIMAL(14,2);
ALTER TABLE "invoices" ADD COLUMN "issuedByUserId" TEXT;

-- AlterTable payrolls
ALTER TABLE "payrolls" ADD COLUMN "batchNumber" TEXT;
ALTER TABLE "payrolls" ADD COLUMN "periodStart" DATE;
ALTER TABLE "payrolls" ADD COLUMN "periodEnd" DATE;
ALTER TABLE "payrolls" ADD COLUMN "totalGross" DECIMAL(14,2);
ALTER TABLE "payrolls" ADD COLUMN "totalNet" DECIMAL(14,2);
ALTER TABLE "payrolls" ADD COLUMN "taxWithheld" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "payrolls" ADD COLUMN "employeeCount" INTEGER;
ALTER TABLE "payrolls" ADD COLUMN "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "payrolls" ADD COLUMN "submittedByUserId" TEXT;
ALTER TABLE "payrolls" ADD COLUMN "approvedByUserId" TEXT;
ALTER TABLE "payrolls" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "payrolls" ADD COLUMN "paidAt" TIMESTAMP(3);

-- CreateTable invoice_line_items
CREATE TABLE "invoice_line_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unit" TEXT,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxType" TEXT NOT NULL,
    "taxRatePct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lineSubtotal" DECIMAL(14,2) NOT NULL,
    "lineTaxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable daily_cashflows
CREATE TABLE "daily_cashflows" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "inflowAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "outflowAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_cashflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable vendor_payments
CREATE TABLE "vendor_payments" (
    "id" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "vendorReference" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "VendorPaymentStatus" NOT NULL DEFAULT 'PAID',
    "paidAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable approval_tasks
CREATE TABLE "approval_tasks" (
    "id" TEXT NOT NULL,
    "assigneeUserId" TEXT NOT NULL,
    "requesterEmployeeId" TEXT NOT NULL,
    "actionTitle" TEXT NOT NULL,
    "priority" "ApprovalTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ApprovalTaskStatus" NOT NULL DEFAULT 'PENDING',
    "entityType" "ApprovalEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable financial_activities
CREATE TABLE "financial_activities" (
    "id" TEXT NOT NULL,
    "category" "FinancialActivityCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable financial_events
CREATE TABLE "financial_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "unitLabel" TEXT,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");
CREATE INDEX "invoices_invoiceDate_idx" ON "invoices"("invoiceDate");
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");
CREATE INDEX "invoice_line_items_invoiceId_idx" ON "invoice_line_items"("invoiceId");
CREATE UNIQUE INDEX "payrolls_batchNumber_key" ON "payrolls"("batchNumber");
CREATE INDEX "payrolls_status_idx" ON "payrolls"("status");
CREATE INDEX "payrolls_periodStart_periodEnd_idx" ON "payrolls"("periodStart", "periodEnd");
CREATE UNIQUE INDEX "daily_cashflows_date_key" ON "daily_cashflows"("date");
CREATE INDEX "daily_cashflows_date_idx" ON "daily_cashflows"("date");
CREATE INDEX "vendor_payments_paidAt_idx" ON "vendor_payments"("paidAt");
CREATE INDEX "vendor_payments_status_idx" ON "vendor_payments"("status");
CREATE INDEX "approval_tasks_assigneeUserId_status_idx" ON "approval_tasks"("assigneeUserId", "status");
CREATE INDEX "approval_tasks_entityType_entityId_idx" ON "approval_tasks"("entityType", "entityId");
CREATE INDEX "financial_activities_occurredAt_idx" ON "financial_activities"("occurredAt");
CREATE INDEX "financial_activities_category_idx" ON "financial_activities"("category");
CREATE INDEX "financial_events_startAt_idx" ON "financial_events"("startAt");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_requesterEmployeeId_fkey" FOREIGN KEY ("requesterEmployeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "financial_events" ADD CONSTRAINT "financial_events_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
