-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "grandTotal" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'PKR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "receivedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_poNumber_key" ON "purchase_orders"("poNumber");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_poNumber_idx" ON "purchase_orders"("poNumber");
