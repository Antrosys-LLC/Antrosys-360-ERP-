-- CreateEnum
CREATE TYPE "ClientSalesStage" AS ENUM ('INITIAL_CONTACT', 'PROPOSAL', 'NEGOTIATION', 'CONTRACT_REVIEW', 'CLOSED_WON');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "clientCode" TEXT;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "industry" TEXT;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "tier" TEXT;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "salesStage" "ClientSalesStage";
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "lifetimeValue" DECIMAL(14,2);
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "healthScore" INTEGER NOT NULL DEFAULT 75;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "healthMetrics" JSONB;
ALTER TABLE "clients" ALTER COLUMN "currencyCode" SET DEFAULT 'PKR';

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "clients_clientCode_key" ON "clients"("clientCode");
CREATE INDEX IF NOT EXISTS "clients_salesStage_idx" ON "clients"("salesStage");

-- CreateTable
CREATE TABLE IF NOT EXISTS "client_contacts" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "client_contacts_clientId_idx" ON "client_contacts"("clientId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
