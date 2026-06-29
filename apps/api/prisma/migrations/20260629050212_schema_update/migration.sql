-- Extend onboard teams with manager hierarchy (teams table already exists from add_onboard_models)
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "teamId" TEXT;

ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "attachmentUrl" TEXT;

ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "managerId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "teams_managerId_key" ON "teams"("managerId");

DO $$ BEGIN
  ALTER TABLE "employees" ADD CONSTRAINT "employees_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "teams" ADD CONSTRAINT "teams_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
