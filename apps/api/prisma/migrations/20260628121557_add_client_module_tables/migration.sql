-- CreateTable
CREATE TABLE "client_statuses" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_renewals" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "amount" DECIMAL(14,2),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_renewals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_activities" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_projects" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_tasks" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_timeline_events" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_statuses_clientId_idx" ON "client_statuses"("clientId");

-- CreateIndex
CREATE INDEX "client_statuses_createdAt_idx" ON "client_statuses"("createdAt");

-- CreateIndex
CREATE INDEX "client_renewals_clientId_idx" ON "client_renewals"("clientId");

-- CreateIndex
CREATE INDEX "client_renewals_dueAt_idx" ON "client_renewals"("dueAt");

-- CreateIndex
CREATE INDEX "client_renewals_status_idx" ON "client_renewals"("status");

-- CreateIndex
CREATE INDEX "client_activities_clientId_idx" ON "client_activities"("clientId");

-- CreateIndex
CREATE INDEX "client_activities_createdAt_idx" ON "client_activities"("createdAt");

-- CreateIndex
CREATE INDEX "client_projects_clientId_idx" ON "client_projects"("clientId");

-- CreateIndex
CREATE INDEX "client_projects_status_idx" ON "client_projects"("status");

-- CreateIndex
CREATE INDEX "client_tasks_clientId_idx" ON "client_tasks"("clientId");

-- CreateIndex
CREATE INDEX "client_tasks_dueAt_idx" ON "client_tasks"("dueAt");

-- CreateIndex
CREATE INDEX "client_tasks_status_idx" ON "client_tasks"("status");

-- CreateIndex
CREATE INDEX "client_timeline_events_clientId_idx" ON "client_timeline_events"("clientId");

-- CreateIndex
CREATE INDEX "client_timeline_events_eventDate_idx" ON "client_timeline_events"("eventDate");

-- AddForeignKey
ALTER TABLE "client_statuses" ADD CONSTRAINT "client_statuses_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_renewals" ADD CONSTRAINT "client_renewals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_activities" ADD CONSTRAINT "client_activities_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_projects" ADD CONSTRAINT "client_projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_tasks" ADD CONSTRAINT "client_tasks_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_timeline_events" ADD CONSTRAINT "client_timeline_events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
