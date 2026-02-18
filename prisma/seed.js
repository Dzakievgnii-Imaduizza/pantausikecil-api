const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

// opsional: kalau env tidak ke-load dari compose, aktifkan:
// require("dotenv/config");

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
   Helpers
========================= */
function parseDate(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  if (!s) return null;
  const iso = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseIntStrict(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

// Prisma Decimal aman dikirim sebagai STRING (lebih aman daripada float)
function parseDecimal(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  if (!s) return null;
  // kalau ada koma desimal
  return s.replace(",", ".");
}

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

/* =========================
   CSV OPTIONS
   Catatan:
   - dataAnak.csv kamu TANPA header → pakai headers: [...]
   - posyandu.csv & pemeriksaan.csv: di bawah aku set TANPA header juga.
     Kalau file kamu PAKAI header, set `skipLines: 1` di options-nya.
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
    "kelurahan",
  ],
  mapValues: ({ value }) => (typeof value === "string" ? value.trim() : value),
};

const csvOptionsPosyandu = {
  separator: ",",
  headers: [
    "posyanduId",
    "namaPosyandu",
    "alamatPosyandu",
    "rt",
    "rw",
    "kelurahan",
    "kecamatan",
    "kabupatenKota",
  ],
  mapValues: ({ value }) => (typeof value === "string" ? value.trim() : value),
  // kalau posyandu.csv kamu PAKAI header, ganti ke: skipLines: 1
};

const csvOptionsPemeriksaan = {
  separator: ",",
  headers: [
    "pemeriksaanId",
    "anakId",
    "umurBulan",
    "tanggalPemeriksaan",
    "tinggiCm",
    "beratKg",
    "lingkarKepalaCm",
    "klasifikasiStunting",  // <-- pindah ke sini (kolom ke-8)
    "saranGizi",            // <-- kolom ke-9 (string panjang)
    "createdAt",            // <-- kolom ke-10
    "updatedAt",            // <-- kolom ke-11
    "caraUkur",             // <-- kolom ke-12 (Berdiri/Terlentang)
    "lingkarLenganAtasCm",  // <-- kolom ke-13 (Decimal)
    "umurTahun",            // <-- kolom ke-14 (Int)
  ],
  mapValues: ({ value }) => (typeof value === "string" ? value.trim() : value),
  // kalau pemeriksaan.csv kamu PAKAI header, ganti ke: skipLines: 1
};


/* =========================
   Seed Posyandu
========================= */

// fallback: bikin posyandu dari dataAnak.csv berdasarkan posyanduId unik
async function seedPosyanduFromDataAnakFallback() {
  console.log("ℹ posyandu.csv tidak ditemukan → buat Posyandu dari dataAnak.csv (placeholder).");

  const anakPath = path.join(__dirname, "dataAnak.csv");
  if (!exists(anakPath)) {
    console.warn("⚠ dataAnak.csv tidak ditemukan, tidak bisa fallback posyandu.");
    return;
  }

  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(anakPath)
      .pipe(csv(csvOptionsAnak))
      .on("data", (d) => rows.push(d))
      .on("end", resolve)
      .on("error", reject);
  });

  const byPosyandu = new Map();
  for (const r of rows) {
    if (!r.posyanduId) continue;
    if (!byPosyandu.has(r.posyanduId)) {
      byPosyandu.set(r.posyanduId, r);
    }
  }

  for (const [posyanduId, r] of byPosyandu.entries()) {
    await prisma.posyandu.upsert({
      where: { posyanduId },
      update: {},
      create: {
        posyanduId,
        namaPosyandu: `Posyandu ${String(posyanduId).slice(0, 8)}`,
        alamatPosyandu: "-",
        rt: String(r.rtAnak ?? "0"),
        rw: String(r.rwAnak ?? "0"),
        kelurahan: r.kelurahan ?? "-",
        kecamatan: r.kecamatan ?? "-",
        kabupatenKota: r.kabupatenKota ?? "-",
      },
    });
  }

  console.log("✔ posyandu (fallback) seeded");
}

async function seedPosyandu() {
  const posPath = path.join(__dirname, "posyandu.csv");
  if (!exists(posPath)) {
    await seedPosyanduFromDataAnakFallback();
    return;
  }

  const results = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(posPath)
      .pipe(csv(csvOptionsPosyandu))
      .on("data", (d) => results.push(d))
      .on("end", resolve)
      .on("error", reject);
  });

  for (const row of results) {
    if (!row.posyanduId) { console.warn("Skip posyandu: posyanduId kosong", row); continue; }
    if (!row.namaPosyandu) { console.warn("Skip posyandu: namaPosyandu kosong", row); continue; }

    await prisma.posyandu.upsert({
      where: { posyanduId: row.posyanduId },
      update: {
        namaPosyandu: row.namaPosyandu,
        alamatPosyandu: row.alamatPosyandu ?? "-",
        rt: String(row.rt ?? "0"),
        rw: String(row.rw ?? "0"),
        kelurahan: row.kelurahan ?? "-",
        kecamatan: row.kecamatan ?? "-",
        kabupatenKota: row.kabupatenKota ?? "-",
      },
      create: {
        posyanduId: row.posyanduId,
        namaPosyandu: row.namaPosyandu,
        alamatPosyandu: row.alamatPosyandu ?? "-",
        rt: String(row.rt ?? "0"),
        rw: String(row.rw ?? "0"),
        kelurahan: row.kelurahan ?? "-",
        kecamatan: row.kecamatan ?? "-",
        kabupatenKota: row.kabupatenKota ?? "-",
      },
    });
  }

  console.log("✔ posyandu seeded");
}

/* =========================
   Seed Data Anak
========================= */
async function seedDataAnak() {
  const anakPath = path.join(__dirname, "dataAnak.csv");
  if (!exists(anakPath)) {
    console.warn("⚠ dataAnak.csv tidak ditemukan, skip seedDataAnak()");
    return;
  }

  const results = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(anakPath)
      .pipe(csv(csvOptionsAnak))
      .on("data", (d) => results.push(d))
      .on("end", resolve)
      .on("error", reject);
  });

  for (const row of results) {
    if (!row.anakId) { console.warn("Skip: anakId kosong", row); continue; }
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
}

/* =========================
   Seed Pemeriksaan
========================= */
async function seedPemeriksaan() {
  const pemPath = path.join(__dirname, "pemeriksaan.csv");
  if (!exists(pemPath)) {
    console.log("ℹ pemeriksaan.csv tidak ditemukan → skip seedPemeriksaan()");
    return;
  }

  const results = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(pemPath)
      .pipe(csv(csvOptionsPemeriksaan))
      .on("data", (d) => results.push(d))
      .on("end", resolve)
      .on("error", reject);
  });

  for (const row of results) {
    if (!row.anakId) { console.warn("Skip pemeriksaan: anakId kosong", row); continue; }

    const umurBulan = parseIntStrict(row.umurBulan);
    const tgl = parseDate(row.tanggalPemeriksaan);

    const tinggi = parseDecimal(row.tinggiCm);
    const berat = parseDecimal(row.beratKg);
    const lk = parseDecimal(row.lingkarKepalaCm);

    if (umurBulan === null) { console.warn("Skip pemeriksaan: umurBulan invalid", row); continue; }
    if (!tgl) { console.warn("Skip pemeriksaan: tanggalPemeriksaan invalid", row); continue; }
    if (!tinggi || !berat || !lk) { console.warn("Skip pemeriksaan: tinggi/berat/lk kosong", row); continue; }
    if (!row.klasifikasiStunting) { console.warn("Skip pemeriksaan: klasifikasiStunting kosong", row); continue; }
    if (!row.saranGizi) { console.warn("Skip pemeriksaan: saranGizi kosong", row); continue; }

    await prisma.pemeriksaan.create({
      data: {
        // pemeriksaanId biarkan auto uuid (lebih aman)
        anakId: row.anakId,
        umurBulan,
        tanggalPemeriksaan: tgl,
        tinggiCm: tinggi,
        beratKg: berat,
        lingkarKepalaCm: lk,
        lingkarLenganAtasCm: parseDecimal(row.lingkarLenganAtasCm),
        caraUkur: row.caraUkur || null,
        umurTahun: parseIntStrict(row.umurTahun) ?? 0,
        klasifikasiStunting: row.klasifikasiStunting,
        saranGizi: row.saranGizi,
      },
    });
  }

  console.log("✔ pemeriksaan seeded");
}

/* =========================
   MAIN (URUTAN DIPERBAIKI)
========================= */
async function main() {
  console.log("🚀 Start Seeding...");

  // Penting: Posyandu dulu → baru DataAnak → baru Pemeriksaan
  await seedPosyandu();
  await seedDataAnak();
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
