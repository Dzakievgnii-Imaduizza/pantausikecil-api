/*
  Warnings:

  - Made the column `posyanduId` on table `AppUser` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tempatLahir` on table `DataAnak` required. This step will fail if there are existing NULL values in that column.
  - Made the column `alamatAnak` on table `DataAnak` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rtAnak` on table `DataAnak` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rwAnak` on table `DataAnak` required. This step will fail if there are existing NULL values in that column.
  - Made the column `kecamatan` on table `DataAnak` required. This step will fail if there are existing NULL values in that column.
  - Made the column `kabupatenKota` on table `DataAnak` required. This step will fail if there are existing NULL values in that column.
  - Made the column `namaOrangTua` on table `DataAnak` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nomorOrangTua` on table `DataAnak` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tinggiCm` on table `Pemeriksaan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `beratKg` on table `Pemeriksaan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lingkarKepalaCm` on table `Pemeriksaan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `klasifikasiStunting` on table `Pemeriksaan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `saranGizi` on table `Pemeriksaan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rt` on table `Posyandu` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rw` on table `Posyandu` required. This step will fail if there are existing NULL values in that column.
  - Made the column `kecamatan` on table `Posyandu` required. This step will fail if there are existing NULL values in that column.
  - Made the column `kabupatenKota` on table `Posyandu` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AppUser" ALTER COLUMN "posyanduId" SET NOT NULL;

-- AlterTable
ALTER TABLE "DataAnak" ALTER COLUMN "tempatLahir" SET NOT NULL,
ALTER COLUMN "alamatAnak" SET NOT NULL,
ALTER COLUMN "rtAnak" SET NOT NULL,
ALTER COLUMN "rwAnak" SET NOT NULL,
ALTER COLUMN "kecamatan" SET NOT NULL,
ALTER COLUMN "kabupatenKota" SET NOT NULL,
ALTER COLUMN "namaOrangTua" SET NOT NULL,
ALTER COLUMN "nomorOrangTua" SET NOT NULL;

-- AlterTable
ALTER TABLE "Pemeriksaan" ALTER COLUMN "tinggiCm" SET NOT NULL,
ALTER COLUMN "beratKg" SET NOT NULL,
ALTER COLUMN "lingkarKepalaCm" SET NOT NULL,
ALTER COLUMN "klasifikasiStunting" SET NOT NULL,
ALTER COLUMN "saranGizi" SET NOT NULL;

-- AlterTable
ALTER TABLE "Posyandu" ALTER COLUMN "rt" SET NOT NULL,
ALTER COLUMN "rw" SET NOT NULL,
ALTER COLUMN "kecamatan" SET NOT NULL,
ALTER COLUMN "kabupatenKota" SET NOT NULL;
