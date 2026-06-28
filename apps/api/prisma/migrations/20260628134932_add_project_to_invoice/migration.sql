-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "projectId" TEXT;

-- CreateIndex
CREATE INDEX "invoices_projectId_idx" ON "invoices"("projectId");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "client_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
