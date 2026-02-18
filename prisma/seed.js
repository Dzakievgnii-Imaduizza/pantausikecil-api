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

  // support "YYYY-MM-DD HH:mm:ss.xxx" -> ISO-like
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

// Prisma Decimal aman dikirim sebagai STRING
function parseDecimal(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  if (!s) return null;
  return s.replace(",", "."); // koma -> titik
}

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

async function readCsv(filePath, options) {
  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv(options))
      .on("data", (d) => rows.push(d))
      .on("end", resolve)
      .on("error", reject);
  });
  return rows;
}

/* =========================
   CSV OPTIONS (NO HEADER)
========================= */

const trimValue = ({ value }) =>
  typeof value === "string" ? value.trim() : value;

const csvOptionsAppUser = {
  separator: ",",
  headers: [
    "userId",
    "posyanduId",
    "nama",
    "email",
    "passwordHash",
    "role",
    "createdAt",
    "updatedAt",
  ],
  mapValues: trimValue,
};

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
  mapValues: trimValue,
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
  mapValues: trimValue,
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
    "klasifikasiStunting", // kolom 8
    "saranGizi",           // kolom 9 (string panjang)
    "createdAt",           // kolom 10
    "updatedAt",           // kolom 11
    "caraUkur",            // kolom 12 (Berdiri/Terlentang)
    "lingkarLenganAtasCm", // kolom 13 (Decimal, boleh kosong)
    "umurTahun",           // kolom 14 (Int)
  ],
  mapValues: trimValue,
};

/* =========================
   Seed Posyandu
========================= */

// placeholder posyandu kalau belum ada
async function ensurePosyandu(posyanduId, fallback = {}) {
  if (!posyanduId) return;

  await prisma.posyandu.upsert({
    where: { posyanduId },
    update: {},
    create: {
      posyanduId,
      namaPosyandu: fallback.namaPosyandu || `Posyandu ${String(posyanduId).slice(0, 8)}`,
      alamatPosyandu: fallback.alamatPosyandu || "-",
      rt: String(fallback.rt ?? "0"),
      rw: String(fallback.rw ?? "0"),
      kelurahan: fallback.kelurahan || "-",
      kecamatan: fallback.kecamatan || "-",
      kabupatenKota: fallback.kabupatenKota || "-",
    },
  });
}

// fallback: bikin posyandu dari dataAnak.csv (dan appUser.csv jika ada)
async function seedPosyanduFallback() {
  console.log("ℹ posyandu.csv tidak ditemukan → buat Posyandu placeholder dari data CSV.");

  const byPosyandu = new Map();

  const anakPath = path.join(__dirname, "dataAnak.csv");
  if (exists(anakPath)) {
    const anakRows = await readCsv(anakPath, csvOptionsAnak);
    for (const r of anakRows) {
      if (!r.posyanduId) continue;
      if (!byPosyandu.has(r.posyanduId)) {
        byPosyandu.set(r.posyanduId, {
          rt: r.rtAnak ?? "0",
          rw: r.rwAnak ?? "0",
          kelurahan: r.kelurahan ?? "-",
          kecamatan: r.kecamatan ?? "-",
          kabupatenKota: r.kabupatenKota ?? "-",
        });
      }
    }
  }

  const userPath = path.join(__dirname, "appUser.csv");
  if (exists(userPath)) {
    const userRows = await readCsv(userPath, csvOptionsAppUser);
    for (const r of userRows) {
      if (!r.posyanduId) continue;
      if (!byPosyandu.has(r.posyanduId)) {
        byPosyandu.set(r.posyanduId, {});
      }
    }
  }

  for (const [posyanduId, meta] of byPosyandu.entries()) {
    await ensurePosyandu(posyanduId, meta);
  }

  console.log("✔ posyandu (fallback) seeded");
}

async function seedPosyandu() {
  const posPath = path.join(__dirname, "posyandu.csv");
  if (!exists(posPath)) {
    await seedPosyanduFallback();
    return;
  }

  const rows = await readCsv(posPath, csvOptionsPosyandu);

  for (const r of rows) {
    if (!r.posyanduId) {
      console.warn("Skip posyandu: posyanduId kosong", r);
      continue;
    }
    if (!r.namaPosyandu) {
      console.warn("Skip posyandu: namaPosyandu kosong", r);
      continue;
    }

    await prisma.posyandu.upsert({
      where: { posyanduId: r.posyanduId },
      update: {
        namaPosyandu: r.namaPosyandu,
        alamatPosyandu: r.alamatPosyandu ?? "-",
        rt: String(r.rt ?? "0"),
        rw: String(r.rw ?? "0"),
        kelurahan: r.kelurahan ?? "-",
        kecamatan: r.kecamatan ?? "-",
        kabupatenKota: r.kabupatenKota ?? "-",
      },
      create: {
        posyanduId: r.posyanduId,
        namaPosyandu: r.namaPosyandu,
        alamatPosyandu: r.alamatPosyandu ?? "-",
        rt: String(r.rt ?? "0"),
        rw: String(r.rw ?? "0"),
        kelurahan: r.kelurahan ?? "-",
        kecamatan: r.kecamatan ?? "-",
        kabupatenKota: r.kabupatenKota ?? "-",
      },
    });
  }

  console.log("✔ posyandu seeded");
}

/* =========================
   Seed AppUser
========================= */
async function seedAppUser() {
  const userPath = path.join(__dirname, "appUser.csv");
  if (!exists(userPath)) {
    console.warn("⚠ appUser.csv tidak ditemukan, skip seedAppUser()");
    return;
  }

  const rows = await readCsv(userPath, csvOptionsAppUser);

  for (const r of rows) {
    if (!r.userId) { console.warn("Skip AppUser: userId kosong", r); continue; }
    if (!r.posyanduId) { console.warn("Skip AppUser: posyanduId kosong", r); continue; }
    if (!r.nama) { console.warn("Skip AppUser: nama kosong", r); continue; }
    if (!r.email) { console.warn("Skip AppUser: email kosong", r); continue; }
    if (!r.passwordHash) { console.warn("Skip AppUser: passwordHash kosong", r); continue; }

    // pastikan posyandu ada biar FK aman
    await ensurePosyandu(r.posyanduId);

    await prisma.appUser.upsert({
      where: { userId: r.userId },
      update: {
        posyanduId: r.posyanduId,
        nama: r.nama,
        email: r.email,
        passwordHash: r.passwordHash,
        role: r.role || "kader",
        // createdAt/updatedAt biar default DB saja kalau invalid
        ...(parseDate(r.createdAt) ? { createdAt: parseDate(r.createdAt) } : {}),
        ...(parseDate(r.updatedAt) ? { updatedAt: parseDate(r.updatedAt) } : {}),
      },
      create: {
        userId: r.userId,
        posyanduId: r.posyanduId,
        nama: r.nama,
        email: r.email,
        passwordHash: r.passwordHash,
        role: r.role || "kader",
        ...(parseDate(r.createdAt) ? { createdAt: parseDate(r.createdAt) } : {}),
        ...(parseDate(r.updatedAt) ? { updatedAt: parseDate(r.updatedAt) } : {}),
      },
    });
  }

  console.log("✔ appUser seeded");
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

  const rows = await readCsv(anakPath, csvOptionsAnak);

  for (const r of rows) {
    if (!r.anakId) { console.warn("Skip DataAnak: anakId kosong", r); continue; }
    if (!r.posyanduId) { console.warn("Skip DataAnak: posyanduId kosong", r); continue; }
    if (!r.nama) { console.warn("Skip DataAnak: nama kosong", r); continue; }
    if (!r.nik) { console.warn("Skip DataAnak: nik kosong", r); continue; }

    // pastikan posyandu ada
    await ensurePosyandu(r.posyanduId, {
      rt: r.rtAnak,
      rw: r.rwAnak,
      kelurahan: r.kelurahan,
      kecamatan: r.kecamatan,
      kabupatenKota: r.kabupatenKota,
    });

    const tgl = parseDate(r.tanggalLahir);
    if (!tgl) { console.warn("Skip DataAnak: tanggalLahir invalid", r); continue; }

    await prisma.dataAnak.upsert({
      where: { anakId: r.anakId },
      update: {
        posyanduId: r.posyanduId,
        nama: r.nama,
        jenisKelamin: r.jenisKelamin || "-",
        tempatLahir: r.tempatLahir || "-",
        tanggalLahir: tgl,
        alamatAnak: r.alamatAnak || "-",
        rtAnak: String(r.rtAnak ?? ""),
        rwAnak: String(r.rwAnak ?? ""),
        kelurahan: r.kelurahan || "-",
        kecamatan: r.kecamatan || "-",
        kabupatenKota: r.kabupatenKota || "-",
        namaOrangTua: r.namaOrangTua || "-",
        nomorOrangTua: String(r.nomorOrangTua ?? ""),
        nik: r.nik,
        ...(parseDate(r.createdAt) ? { createdAt: parseDate(r.createdAt) } : {}),
        ...(parseDate(r.updatedAt) ? { updatedAt: parseDate(r.updatedAt) } : {}),
      },
      create: {
        anakId: r.anakId,
        posyanduId: r.posyanduId,
        nama: r.nama,
        jenisKelamin: r.jenisKelamin || "-",
        tempatLahir: r.tempatLahir || "-",
        tanggalLahir: tgl,
        alamatAnak: r.alamatAnak || "-",
        rtAnak: String(r.rtAnak ?? ""),
        rwAnak: String(r.rwAnak ?? ""),
        kelurahan: r.kelurahan || "-",
        kecamatan: r.kecamatan || "-",
        kabupatenKota: r.kabupatenKota || "-",
        namaOrangTua: r.namaOrangTua || "-",
        nomorOrangTua: String(r.nomorOrangTua ?? ""),
        nik: r.nik,
        ...(parseDate(r.createdAt) ? { createdAt: parseDate(r.createdAt) } : {}),
        ...(parseDate(r.updatedAt) ? { updatedAt: parseDate(r.updatedAt) } : {}),
      },
    });
  }

  console.log("✔ dataAnak seeded");
}

/* =========================
   Seed Pemeriksaan
========================= */
async function seedPemeriksaan() {
  const pPath = path.join(__dirname, "pemeriksaan.csv");
  if (!exists(pPath)) {
    console.warn("⚠ pemeriksaan.csv tidak ditemukan, skip seedPemeriksaan()");
    return;
  }

  const rows = await readCsv(pPath, csvOptionsPemeriksaan);

  for (const r of rows) {
    if (!r.pemeriksaanId) { console.warn("Skip Pemeriksaan: pemeriksaanId kosong", r); continue; }
    if (!r.anakId) { console.warn("Skip Pemeriksaan: anakId kosong", r); continue; }

    const umurBulan = parseIntStrict(r.umurBulan);
    const umurTahun = parseIntStrict(r.umurTahun) ?? 0;
    const tgl = parseDate(r.tanggalPemeriksaan);

    const tinggi = parseDecimal(r.tinggiCm);
    const berat = parseDecimal(r.beratKg);
    const lk = parseDecimal(r.lingkarKepalaCm);

    if (umurBulan === null) { console.warn("Skip Pemeriksaan: umurBulan invalid", r); continue; }
    if (!tgl) { console.warn("Skip Pemeriksaan: tanggalPemeriksaan invalid", r); continue; }
    if (!tinggi || !berat || !lk) { console.warn("Skip Pemeriksaan: decimal wajib invalid", r); continue; }
    if (!r.klasifikasiStunting) { console.warn("Skip Pemeriksaan: klasifikasiStunting kosong", r); continue; }
    if (!r.saranGizi) { console.warn("Skip Pemeriksaan: saranGizi kosong", r); continue; }

    const lila = parseDecimal(r.lingkarLenganAtasCm);

    await prisma.pemeriksaan.upsert({
      where: { pemeriksaanId: r.pemeriksaanId },
      update: {
        anakId: r.anakId,
        umurBulan,
        tanggalPemeriksaan: tgl,
        tinggiCm: tinggi,
        beratKg: berat,
        lingkarKepalaCm: lk,
        lingkarLenganAtasCm: lila,
        caraUkur: r.caraUkur || null,
        umurTahun,
        klasifikasiStunting: r.klasifikasiStunting,
        saranGizi: r.saranGizi,
        ...(parseDate(r.createdAt) ? { createdAt: parseDate(r.createdAt) } : {}),
        ...(parseDate(r.updatedAt) ? { updatedAt: parseDate(r.updatedAt) } : {}),
      },
      create: {
        pemeriksaanId: r.pemeriksaanId,
        anakId: r.anakId,
        umurBulan,
        tanggalPemeriksaan: tgl,
        tinggiCm: tinggi,
        beratKg: berat,
        lingkarKepalaCm: lk,
        lingkarLenganAtasCm: lila,
        caraUkur: r.caraUkur || null,
        umurTahun,
        klasifikasiStunting: r.klasifikasiStunting,
        saranGizi: r.saranGizi,
        ...(parseDate(r.createdAt) ? { createdAt: parseDate(r.createdAt) } : {}),
        ...(parseDate(r.updatedAt) ? { updatedAt: parseDate(r.updatedAt) } : {}),
      },
    });
  }

  console.log("✔ pemeriksaan seeded");
}

/* =========================
   MAIN
========================= */
async function main() {
  console.log("🚀 Start Seeding...");

  // urutan aman (FK)
  await seedPosyandu();
  await seedAppUser();   // ✅ tambahan AppUser
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
