const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function parseBoolean(val) {
  if (val === "t" || val === "true" || val === true) return true;
  if (val === "f" || val === "false" || val === false) return false;
  return null;
}

function parseNumber(val) {
  if (val === "" || val === null || val === undefined) return null;
  return Number(val);
}

function parseDate(val) {
  if (!val) return null;
  return new Date(val);
}

async function seedDataAnak() {
  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, "dataAnak.csv"))
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          for (const row of results) {
            await prisma.dataAnak.create({
              data: {
                id: parseNumber(row.id),
                nama: row.nama,
                tanggal_lahir: parseDate(row.tanggal_lahir),
                jenis_kelamin: row.jenis_kelamin,
                nama_ibu: row.nama_ibu,
                alamat: row.alamat,
              },
            });
          }
          console.log("✔ dataAnak seeded");
          resolve();
        } catch (err) {
          reject(err);
        }
      });
  });
}

async function seedPosyandu() {
  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, "posyandu.csv"))
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          for (const row of results) {
            await prisma.posyandu.create({
              data: {
                id: parseNumber(row.id),
                nama: row.nama,
                alamat: row.alamat,
              },
            });
          }
          console.log("✔ posyandu seeded");
          resolve();
        } catch (err) {
          reject(err);
        }
      });
  });
}

async function seedPemeriksaan() {
  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, "pemeriksaan.csv"))
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          for (const row of results) {
            await prisma.pemeriksaan.create({
              data: {
                id: parseNumber(row.id),
                anakId: parseNumber(row.anakId),
                posyanduId: parseNumber(row.posyanduId),
                tanggal: parseDate(row.tanggal),
                berat_badan: parseNumber(row.berat_badan),
                tinggi_badan: parseNumber(row.tinggi_badan),
                imunisasi: parseBoolean(row.imunisasi),
                vitamin: parseBoolean(row.vitamin),
              },
            });
          }
          console.log("✔ pemeriksaan seeded");
          resolve();
        } catch (err) {
          reject(err);
        }
      });
  });
}

async function main() {
  console.log("🚀 Start Seeding...");

  await seedDataAnak();
  await seedPosyandu();
  await seedPemeriksaan();

  console.log("🎉 All data seeded successfully");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
