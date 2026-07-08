-- AlterTable
ALTER TABLE "client_projects" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "client_projects" ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "client_projects" ADD COLUMN "projectManager" TEXT;
