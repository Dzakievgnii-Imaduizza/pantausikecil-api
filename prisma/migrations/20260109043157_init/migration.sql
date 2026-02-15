-- CreateTable
CREATE TABLE "Posyandu" (
    "posyanduId" TEXT NOT NULL,
    "namaPosyandu" TEXT NOT NULL,
    "alamatPosyandu" TEXT NOT NULL,
    "rt" TEXT,
    "rw" TEXT,
    "kecamatan" TEXT,
    "kabupatenKota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Posyandu_pkey" PRIMARY KEY ("posyanduId")
);

-- CreateTable
CREATE TABLE "AppUser" (
    "userId" TEXT NOT NULL,
    "posyanduId" TEXT,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'kader',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "DataAnak" (
    "anakId" TEXT NOT NULL,
    "posyanduId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenisKelamin" TEXT NOT NULL,
    "tempatLahir" TEXT,
    "tanggalLahir" TIMESTAMP(3) NOT NULL,
    "alamatAnak" TEXT,
    "rtAnak" TEXT,
    "rwAnak" TEXT,
    "kecamatan" TEXT,
    "kabupatenKota" TEXT,
    "namaOrangTua" TEXT,
    "nomorOrangTua" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataAnak_pkey" PRIMARY KEY ("anakId")
);

-- CreateTable
CREATE TABLE "Jadwal" (
    "jadwalId" TEXT NOT NULL,
    "posyanduId" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "kegiatan" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jadwal_pkey" PRIMARY KEY ("jadwalId")
);

-- CreateTable
CREATE TABLE "Pemeriksaan" (
    "pemeriksaanId" TEXT NOT NULL,
    "anakId" TEXT NOT NULL,
    "umurBulan" INTEGER NOT NULL,
    "tanggalPemeriksaan" TIMESTAMP(3) NOT NULL,
    "tinggiCm" DECIMAL(65,30),
    "beratKg" DECIMAL(65,30),
    "lingkarKepalaCm" DECIMAL(65,30),
    "klasifikasiStunting" TEXT,
    "saranGizi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pemeriksaan_pkey" PRIMARY KEY ("pemeriksaanId")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_email_key" ON "AppUser"("email");

-- CreateIndex
CREATE INDEX "Pemeriksaan_anakId_idx" ON "Pemeriksaan"("anakId");

-- CreateIndex
CREATE INDEX "Pemeriksaan_tanggalPemeriksaan_idx" ON "Pemeriksaan"("tanggalPemeriksaan");

-- AddForeignKey
ALTER TABLE "AppUser" ADD CONSTRAINT "AppUser_posyanduId_fkey" FOREIGN KEY ("posyanduId") REFERENCES "Posyandu"("posyanduId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataAnak" ADD CONSTRAINT "DataAnak_posyanduId_fkey" FOREIGN KEY ("posyanduId") REFERENCES "Posyandu"("posyanduId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jadwal" ADD CONSTRAINT "Jadwal_posyanduId_fkey" FOREIGN KEY ("posyanduId") REFERENCES "Posyandu"("posyanduId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pemeriksaan" ADD CONSTRAINT "Pemeriksaan_anakId_fkey" FOREIGN KEY ("anakId") REFERENCES "DataAnak"("anakId") ON DELETE CASCADE ON UPDATE CASCADE;
