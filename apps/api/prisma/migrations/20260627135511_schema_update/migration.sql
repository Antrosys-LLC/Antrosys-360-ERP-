-- CreateTable
CREATE TABLE "client_profiles" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sector" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'Mid-Market',
    "healthScore" INTEGER NOT NULL DEFAULT 100,
    "ltv" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_timeline_events" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_tasks" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "date" TEXT,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_pipeline_deals" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "stage" "ClientPipelineStage" NOT NULL,
    "dealSize" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pipeline_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_cards" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'on-track',
    "value" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "trendType" TEXT NOT NULL DEFAULT 'bar',
    "trendData" JSONB NOT NULL DEFAULT '[0]',
    "category" TEXT,
    "period" TEXT NOT NULL,
    "quarter" TEXT,
    "department" TEXT,
    "assigneeUrl" TEXT,
    "badgeText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "path" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "isConfidential" BOOLEAN NOT NULL DEFAULT false,
    "fileUrl" TEXT,
    "folderId" TEXT NOT NULL,
    "previewText" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboardings" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "buddyId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "phase" INTEGER NOT NULL DEFAULT 1,
    "completion" INTEGER NOT NULL DEFAULT 0,
    "templateType" TEXT,
    "email" TEXT,
    "dept" TEXT,
    "avatarText" TEXT,
    "color" TEXT,
    "hasWarning" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboardings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_tasks" (
    "id" TEXT NOT NULL,
    "onboardingId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "subtext" TEXT,
    "hasAction" BOOLEAN NOT NULL DEFAULT false,
    "phase" INTEGER NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_documents" (
    "id" TEXT NOT NULL,
    "onboardingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_clientId_key" ON "client_profiles"("clientId");

-- CreateIndex
CREATE INDEX "client_timeline_events_clientId_idx" ON "client_timeline_events"("clientId");

-- CreateIndex
CREATE INDEX "client_tasks_clientId_idx" ON "client_tasks"("clientId");

-- CreateIndex
CREATE INDEX "sales_pipeline_deals_stage_idx" ON "sales_pipeline_deals"("stage");

-- CreateIndex
CREATE INDEX "documents_folderId_idx" ON "documents"("folderId");

-- CreateIndex
CREATE INDEX "onboardings_employeeId_idx" ON "onboardings"("employeeId");

-- CreateIndex
CREATE INDEX "onboarding_tasks_onboardingId_idx" ON "onboarding_tasks"("onboardingId");

-- CreateIndex
CREATE INDEX "onboarding_documents_onboardingId_idx" ON "onboarding_documents"("onboardingId");

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_timeline_events" ADD CONSTRAINT "client_timeline_events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_tasks" ADD CONSTRAINT "client_tasks_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_pipeline_deals" ADD CONSTRAINT "sales_pipeline_deals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "document_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "document_folders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboardings" ADD CONSTRAINT "onboardings_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboardings" ADD CONSTRAINT "onboardings_buddyId_fkey" FOREIGN KEY ("buddyId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_tasks" ADD CONSTRAINT "onboarding_tasks_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "onboardings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_documents" ADD CONSTRAINT "onboarding_documents_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "onboardings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
