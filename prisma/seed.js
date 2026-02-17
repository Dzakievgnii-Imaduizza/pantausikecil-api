const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

/* =========================
   Prisma Adapter Setup
========================= */

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

/* =========================
   Helper Functions
========================= */

function parseBoolean(val) {
  if (val === "t" || val === "true" || val === true) return true;
  if (val === "f" || val === "false" || val === false) return false;
  return null;
}

function parseNumber(val) {
  if (!val) return null;
  return Number(val);
}

function parseDate(val) {
  if (!val) return null;
  return new Date(val);
}

/* =========================
   Seed Data Anak
========================= */

async function seedDataAnak() {
  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, "dataAnak.csv"))
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          for (const row of results) {
            if (!row.nama) {
              console.log("⚠ Skip dataAnak (nama kosong):", row);
              continue;
            }

            await prisma.dataAnak.create({
              data: {
                nama: row.nama,
                tanggal_lahir: parseDate(row.tanggal_lahir),
                jenis_kelamin: row.jenis_kelamin || null,
                nama_ibu: row.nama_ibu || null,
                alamat: row.alamat || null,
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

/* =========================
   Seed Posyandu
========================= */

async function seedPosyandu() {
  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, "posyandu.csv"))
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          for (const row of results) {
            if (!row.nama) {
              console.log("⚠ Skip posyandu (nama kosong):", row);
              continue;
            }

            await prisma.posyandu.create({
              data: {
                nama: row.nama,
                alamat: row.alamat || null,
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

/* =========================
   Seed Pemeriksaan
========================= */

async function seedPemeriksaan() {
  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, "pemeriksaan.csv"))
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          for (const row of results) {
            if (!row.anakId || !row.posyanduId) {
              console.log("⚠ Skip pemeriksaan (relasi kosong):", row);
              continue;
            }

            await prisma.pemeriksaan.create({
              data: {
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

/* =========================
   MAIN
========================= */

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
