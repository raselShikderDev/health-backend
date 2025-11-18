/*
Warnings:

- You are about to drop the `medical_reports` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'BLOCKED';

-- DropForeignKey
ALTER TABLE "public"."medical_reports" DROP CONSTRAINT "medical_reports_patientId_fkey";

-- DropTable
DROP TABLE "public"." medical_reports";

-- CreateTable
CREATE TABLE "medical_reports" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "reportName" TEXT NOT NULL,
    "reportLink" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "medical_reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "medical_reports"
ADD CONSTRAINT "medical_reports_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;