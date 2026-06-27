-- CreateTable
CREATE TABLE "bi_reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "iconType" TEXT NOT NULL,
    "isFavourite" BOOLEAN NOT NULL DEFAULT false,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bi_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bi_schedules" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "info" TEXT NOT NULL,
    "deliveryMethod" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bi_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bi_executions" (
    "id" TEXT NOT NULL,
    "reportId" TEXT,
    "name" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "failed" BOOLEAN NOT NULL DEFAULT false,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bi_executions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bi_reports" ADD CONSTRAINT "bi_reports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bi_schedules" ADD CONSTRAINT "bi_schedules_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "bi_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bi_executions" ADD CONSTRAINT "bi_executions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "bi_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
