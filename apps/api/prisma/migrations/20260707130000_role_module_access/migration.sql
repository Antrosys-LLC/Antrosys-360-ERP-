-- CreateEnum
CREATE TYPE "ModuleAccessLevel" AS ENUM ('OFF', 'READ', 'FULL');

-- CreateTable
CREATE TABLE "role_module_access" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "module" TEXT NOT NULL,
    "accessLevel" "ModuleAccessLevel" NOT NULL,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_module_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_module_access_role_module_key" ON "role_module_access"("role", "module");

-- AddForeignKey
ALTER TABLE "role_module_access" ADD CONSTRAINT "role_module_access_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
