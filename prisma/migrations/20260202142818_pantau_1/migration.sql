/*
  Warnings:

  - Made the column `kegiatan` on table `Jadwal` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Jadwal" ALTER COLUMN "kegiatan" SET NOT NULL;

-- AlterTable
ALTER TABLE "Pemeriksaan" ADD COLUMN     "caraUkur" TEXT,
ADD COLUMN     "lingkarLenganAtasCm" DECIMAL(65,30),
ADD COLUMN     "umurTahun" INTEGER NOT NULL DEFAULT 0;
