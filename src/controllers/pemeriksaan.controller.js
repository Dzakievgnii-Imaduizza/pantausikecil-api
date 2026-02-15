const anakRepo = require("../repositories/anak.repository");
const pemeriksaanRepo = require("../repositories/pemeriksaan.repository");
const { callN8nGrowthWorkflow } = require("../services/n8n.service");
const { toDateOnlyYYYYMMDD, calcAgeMonths } = require("../utils/date.util");

function requirePosyandu(req, res) {
  const posyanduId = req.user?.posyanduId;
  if (!posyanduId) {
    res.status(400).json({ message: "User tidak terikat posyandu" });
    return null;
  }
  return posyanduId;
}

function normalizeSexToMF(value) {
  // dukung M/F dan L/P (umum di Indonesia)
  if (!value) return null;
  const v = String(value).trim().toUpperCase();
  if (v === "M" || v === "F") return v;
  if (v === "L") return "M";
  if (v === "P") return "F";
  return null;
}

// POST /anak/:anakId/pemeriksaan
async function createForAnak(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const { anakId } = req.params;

  // 1) Pastikan anak milik posyandu
  const anak = await anakRepo.findByIdForPosyandu(anakId, posyanduId);
  if (!anak) return res.status(404).json({ message: "Not found" });

  const {
    dob, // "YYYY-MM-DD" (tetap kamu pakai)
    sex, // "M"/"F" (tetap kamu pakai)
    tanggalPemeriksaan, // datetime string, wajib
    tinggiCm,
    beratKg,
    lingkarKepalaCm,

    // ✅ tambahan baru
    caraUkur,            // string optional (atau wajib kalau kamu mau)
    lingkarLenganAtasCm, // number optional (atau wajib)
  } = req.body || {};

  // 2) Validasi wajib existing
  if (
    !dob ||
    !sex ||
    !tanggalPemeriksaan ||
    tinggiCm === undefined ||
    beratKg === undefined ||
    lingkarKepalaCm === undefined
  ) {
    return res.status(400).json({
      message: "Wajib: dob, sex, tanggalPemeriksaan, tinggiCm, beratKg, lingkarKepalaCm",
    });
  }

  // 3) Validasi sex (support L/P juga)
  const sexMF = normalizeSexToMF(sex);
  if (!sexMF) {
    return res.status(400).json({ message: 'sex harus "M" atau "F" (atau "L"/"P")' });
  }

  // 4) Parse tanggal
  // const dobDate = new Date(`${dob}T00:00:00.000Z`);
  const dobDate = new Date(dob)
  const measurementDateTime = new Date(tanggalPemeriksaan);

  if (Number.isNaN(dobDate.getTime())) {
    return res.status(400).json({ message: "dob tidak valid, gunakan YYYY-MM-DD" });
  }
  if (Number.isNaN(measurementDateTime.getTime())) {
    return res.status(400).json({ message: "tanggalPemeriksaan tidak valid (datetime ISO disarankan)" });
  }

  // 5) Cross-check dob dengan DB (anti ngasal anakId)
  const dbDob = new Date(anak.tanggalLahir);
  const dbDobYMD = toDateOnlyYYYYMMDD(
    new Date(Date.UTC(dbDob.getFullYear(), dbDob.getMonth(), dbDob.getDate()))
  );
  console.log(dbDob, dobDate)
  if (dobDate.getTime() !== dbDob.getTime()) {
    return res.status(400).json({ message: "dob tidak sesuai dengan data anak di server" });
  }

  // (Optional) cross-check sex dengan DB
  const dbSexMF = normalizeSexToMF(anak.jenisKelamin);
  if (dbSexMF && dbSexMF !== sexMF) {
    return res.status(400).json({ message: "sex tidak sesuai dengan data anak di server" });
  }

  // 6) Hitung umurBulan
  const umurBulan = calcAgeMonths(dobDate, measurementDateTime);
  if (umurBulan < 0 || umurBulan > 120) {
    return res.status(400).json({ message: "umurBulan hasil perhitungan tidak valid" });
  }

  // ✅ Hitung umurTahun dari umurBulan
  const umurTahun = Math.floor(umurBulan / 12);

  // 7) Validasi numeric
  const tinggi = Number(tinggiCm);
  const berat = Number(beratKg);
  const lk = Number(lingkarKepalaCm);

  if (Number.isNaN(tinggi) || tinggi <= 0 || tinggi > 200) {
    return res.status(400).json({ message: "tinggiCm harus angka 0..200" });
  }
  if (Number.isNaN(berat) || berat <= 0 || berat > 100) {
    return res.status(400).json({ message: "beratKg harus angka 0..100" });
  }
  if (Number.isNaN(lk) || lk <= 0 || lk > 80) {
    return res.status(400).json({ message: "lingkarKepalaCm harus angka 0..80" });
  }

  // ✅ Validasi opsional field baru
  let lila = null;
  if (lingkarLenganAtasCm !== undefined && lingkarLenganAtasCm !== null && String(lingkarLenganAtasCm).trim() !== "") {
    lila = Number(lingkarLenganAtasCm);
    if (Number.isNaN(lila) || lila <= 0 || lila > 40) {
      return res.status(400).json({ message: "lingkarLenganAtasCm harus angka 0..40" });
    }
  }

  const caraUkurClean =
    caraUkur !== undefined && caraUkur !== null && String(caraUkur).trim() !== ""
      ? String(caraUkur).trim()
      : null;

  // 8) Panggil n8n (measurementDate harus YYYY-MM-DD)
  const measurementYYYYMMDD = toDateOnlyYYYYMMDD(measurementDateTime);

  let n8nResult;
  try {
    n8nResult = await callN8nGrowthWorkflow({
      anakId,
      sex: sexMF,
      dobYYYYMMDD: dob,
      measurementYYYYMMDD,
      heightCm: tinggi,
    });
  } catch (e) {
    return res.status(502).json({
      message: "Gagal memproses ke n8n",
      detail: String(e.message || e),
    });
  }

  // 9) Simpan ke DB + field baru
  const created = await pemeriksaanRepo.create({
    anakId,
    umurTahun, // ✅ baru
    umurBulan,
    caraUkur: caraUkurClean, // ✅ baru
    lingkarLenganAtasCm: lila, // ✅ baru (sesuaikan nama field di repo kalau beda)
    tanggalPemeriksaan: measurementDateTime,
    tinggiCm: tinggi,
    beratKg: berat,
    lingkarKepalaCm: lk,
    klasifikasiStunting: n8nResult.classification,
    saranGizi: n8nResult.nutritionPlan,
  });

  return res.status(201).json(created);
}

// GET /anak/:anakId/pemeriksaan
async function listForAnak(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const { anakId } = req.params;
  const anak = await anakRepo.findByIdForPosyandu(anakId, posyanduId);
  if (!anak) return res.status(404).json({ message: "Not found" });

  const items = await pemeriksaanRepo.listByAnak(anakId);
  res.json(items);

}

// GET /pemeriksaan/:id
async function detail(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const item = await pemeriksaanRepo.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });

  const anak = await anakRepo.findByIdForPosyandu(item.anakId, posyanduId);
  if (!anak) return res.status(404).json({ message: "Not found" });

  res.json(item);
}

// DELETE /pemeriksaan/:id
async function remove(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const item = await pemeriksaanRepo.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });

  const anak = await anakRepo.findByIdForPosyandu(item.anakId, posyanduId);
  if (!anak) return res.status(404).json({ message: "Not found" });

  await pemeriksaanRepo.remove(item.pemeriksaanId);
  res.json({ message: "Deleted" });
}
// function requirePosyandu(req, res) {
//   const posyanduId = req.user?.posyanduId;
//   if (!posyanduId) {
//     res.status(400).json({ message: "User tidak terikat posyandu" });
//     return null;
//   }
//   return posyanduId;
// }

async function jumlah(req, res) {

  
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const { anakId } = req.params;
  const anak = await anakRepo.findByIdForPosyandu(anakId, posyanduId);
  if (!anak) return res.status(404).json({ message: "Not found" });

  const items = await pemeriksaanRepo.listByAnak(anakId);
  res.json({jumlahPemeriksaan : items.length});
}

module.exports = { createForAnak, listForAnak, detail, remove, jumlah };
