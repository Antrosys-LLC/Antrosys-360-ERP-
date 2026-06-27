/*
  Warnings:

  - A unique constraint covering the columns `[employeeCode]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "cnic" TEXT,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "emergencyContactRelation" TEXT,
ADD COLUMN     "employeeCode" TEXT,
ADD COLUMN     "employeeType" TEXT,
ADD COLUMN     "grade" TEXT,
ADD COLUMN     "homeAddress" TEXT,
ADD COLUMN     "kpiScore" INTEGER,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "performanceScore" INTEGER,
ADD COLUMN     "personalEmail" TEXT,
ADD COLUMN     "personalPhone" TEXT,
ADD COLUMN     "preferredName" TEXT,
ADD COLUMN     "socialHandle" TEXT;

-- CreateTable
CREATE TABLE "employee_skills" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "percentage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_skills_employeeId_idx" ON "employee_skills"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeCode_key" ON "employees"("employeeCode");

-- AddForeignKey
ALTER TABLE "employee_skills" ADD CONSTRAINT "employee_skills_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
