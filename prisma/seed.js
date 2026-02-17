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
  const s = String(val).trim();
  if (!s) return null;
  const iso = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}


/* =========================
   Seed Data Anak
========================= */

const csvOptionsAnak = {
  separator: ",",
  headers: [
    "anakId",
    "posyanduId",
    "nama",
    "jenisKelamin",
    "tempatLahir",
    "tanggalLahir",
    "alamatAnak",
    "rtAnak",
    "rwAnak",
    "kecamatan",
    "kabupatenKota",
    "namaOrangTua",
    "nomorOrangTua",
    "createdAt",
    "updatedAt",
    "nik",
    "kelurahan"
  ],
  mapValues: ({ value }) => (typeof value === "string" ? value.trim() : value),
};

async function seedDataAnak() {
  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, "dataAnak.csv"))
      .pipe(csv(csvOptionsAnak))
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          for (const row of results) {
            if (!row.nama) { console.warn("Skip: nama kosong", row); continue; }
            if (!row.posyanduId) { console.warn("Skip: posyanduId kosong", row); continue; }
            if (!row.nik) { console.warn("Skip: nik kosong", row); continue; }

            const tgl = parseDate(row.tanggalLahir);
            if (!tgl) { console.warn("Skip: tanggalLahir invalid", row); continue; }

            await prisma.dataAnak.upsert({
              where: { anakId: row.anakId },
              update: {
                posyanduId: row.posyanduId,
                nama: row.nama,
                jenisKelamin: row.jenisKelamin,
                tempatLahir: row.tempatLahir,
                tanggalLahir: tgl,
                alamatAnak: row.alamatAnak,
                rtAnak: String(row.rtAnak ?? ""),
                rwAnak: String(row.rwAnak ?? ""),
                kelurahan: row.kelurahan,
                kecamatan: row.kecamatan,
                kabupatenKota: row.kabupatenKota,
                namaOrangTua: row.namaOrangTua ?? "",
                nomorOrangTua: row.nomorOrangTua ?? "",
                nik: String(row.nik),
              },
              create: {
                anakId: row.anakId,
                posyanduId: row.posyanduId,
                nama: row.nama,
                jenisKelamin: row.jenisKelamin,
                tempatLahir: row.tempatLahir,
                tanggalLahir: tgl,
                alamatAnak: row.alamatAnak,
                rtAnak: String(row.rtAnak ?? ""),
                rwAnak: String(row.rwAnak ?? ""),
                kelurahan: row.kelurahan,
                kecamatan: row.kecamatan,
                kabupatenKota: row.kabupatenKota,
                namaOrangTua: row.namaOrangTua ?? "",
                nomorOrangTua: row.nomorOrangTua ?? "",
                nik: String(row.nik),
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
