/*
  Warnings:

  - Added the required column `kelurahan` to the `DataAnak` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kelurahan` to the `Posyandu` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DataAnak" ADD COLUMN     "kelurahan" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Posyandu" ADD COLUMN     "kelurahan" TEXT NOT NULL;
