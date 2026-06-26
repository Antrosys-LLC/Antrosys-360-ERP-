-- CreateEnum
CREATE TYPE "ClientPipelineStage" AS ENUM ('PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'ACTIVE', 'AT_RISK');

-- CreateEnum
CREATE TYPE "OperatingCostCategory" AS ENUM ('OPERATIONS', 'SOFTWARE', 'TAX_LEGAL', 'BENEFITS', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceHealthStatus" AS ENUM ('OPERATIONAL', 'DEGRADED', 'DOWN');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "annualRevenue" DECIMAL(14,2),
ADD COLUMN     "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'USD',
ADD COLUMN     "isAtRisk" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monthlyRevenue" DECIMAL(14,2),
ADD COLUMN     "pipelineStage" "ClientPipelineStage" NOT NULL DEFAULT 'PROSPECT',
ADD COLUMN     "renewalDueAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "operating_expenses" (
    "id" TEXT NOT NULL,
    "category" "OperatingCostCategory" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "expenseDate" DATE NOT NULL,
    "description" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operating_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_metric_targets" (
    "id" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "targetValue" DECIMAL(14,2) NOT NULL,
    "currencyCode" VARCHAR(3) DEFAULT 'USD',
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_metric_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_service_health" (
    "id" TEXT NOT NULL,
    "serviceKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "ServiceHealthStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_service_health_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operating_expenses_expenseDate_idx" ON "operating_expenses"("expenseDate");

-- CreateIndex
CREATE INDEX "operating_expenses_category_idx" ON "operating_expenses"("category");

-- CreateIndex
CREATE INDEX "company_metric_targets_metricKey_periodStart_periodEnd_idx" ON "company_metric_targets"("metricKey", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "company_metric_targets_metricKey_periodStart_key" ON "company_metric_targets"("metricKey", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "system_service_health_serviceKey_key" ON "system_service_health"("serviceKey");

-- CreateIndex
CREATE INDEX "clients_pipelineStage_idx" ON "clients"("pipelineStage");

-- CreateIndex
CREATE INDEX "clients_isAtRisk_idx" ON "clients"("isAtRisk");

-- CreateIndex
CREATE INDEX "clients_renewalDueAt_idx" ON "clients"("renewalDueAt");

-- AddForeignKey
ALTER TABLE "operating_expenses" ADD CONSTRAINT "operating_expenses_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
