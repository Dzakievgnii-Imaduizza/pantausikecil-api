/*
  Warnings:

  - A unique constraint covering the columns `[nik]` on the table `DataAnak` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DataAnak" ADD COLUMN     "nik" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DataAnak_nik_key" ON "DataAnak"("nik");
