const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { prisma } = require("../src/db/prisma");

async function readCsvWithoutHeader(fileName) {
  const results = [];
  const filePath = path.join(__dirname, fileName);

  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ headers: false }))
      .on("data", (data) => {
        results.push(Object.values(data));
      })
      .on("end", resolve)
      .on("error", reject);
  });

  return results;
}

async function main() {
  console.log("Seeding started...");

  // =========================
  // 1️⃣ POSYANDU
  // =========================
  const posyanduRows = await readCsvWithoutHeader("posyandu.csv");

  for (const row of posyanduRows) {
    await prisma.posyandu.create({
      data: {
        posyanduId: row[0],
        namaPosyandu: row[1],
        alamatPosyandu: row[2],
        rt: row[3],
        rw: row[4],
        kelurahan: row[5],
        kecamatan: row[6],
        kabupatenKota: row[7],
        createdAt: new Date(row[8]),
        updatedAt: new Date(row[9]),
      },
    });
  }

  console.log("Posyandu inserted:", posyanduRows.length);

  // =========================
  // 2️⃣ APP USER
  // =========================
  const userRows = await readCsvWithoutHeader("appUser.csv");

  for (const row of userRows) {
    await prisma.appUser.create({
      data: {
        userId: row[0],
        posyanduId: row[1],
        nama: row[2],
        email: row[3],
        passwordHash: row[4], // sudah hash
        role: row[5],
        createdAt: new Date(row[6]),
        updatedAt: new Date(row[7]),
      },
    });
  }

  console.log("Users inserted:", userRows.length);

  // =========================
  // 3️⃣ DATA ANAK
  // =========================
  const anakRows = await readCsvWithoutHeader("dataAnak.csv");

  for (const row of anakRows) {
    await prisma.dataAnak.create({
      data: {
        anakId: row[0],
        posyanduId: row[1],
        nama: row[2],
        jenisKelamin: row[3],
        tempatLahir: row[4],
        tanggalLahir: new Date(row[5]),
        alamatAnak: row[6],
        rtAnak: row[7],
        rwAnak: row[8],
        kecamatan: row[9],
        kabupatenKota: row[10],
        namaOrangTua: row[11],
        nomorOrangTua: row[12],
        createdAt: new Date(row[13]),
        updatedAt: new Date(row[14]),
        nik: row[15],
        kelurahan: row[16],
      },
    });
  }

  console.log("Data Anak inserted:", anakRows.length);

  // =========================
  // 4️⃣ PEMERIKSAAN
  // =========================
  const pemeriksaanRows = await readCsvWithoutHeader("pemeriksaan.csv");

  for (const row of pemeriksaanRows) {
    await prisma.pemeriksaan.create({
      data: {
        pemeriksaanId: row[0],
        anakId: row[1],
        beratBadan: parseFloat(row[2]),
        tinggiBadan: parseFloat(row[3]),
        lingkarKepala: parseFloat(row[4]),
        tanggalPeriksa: new Date(row[5]),
        statusGizi: row[6],
        catatan: row[7],
        createdAt: new Date(row[8]),
        updatedAt: new Date(row[9]),
      },
    });
  }

  console.log("Pemeriksaan inserted:", pemeriksaanRows.length);

  console.log("✅ Seeding finished successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
