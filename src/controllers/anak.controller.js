const anakRepo = require("../repositories/anak.repository");
const pemeriksaanRepo = require("../repositories/pemeriksaan.repository");

function requirePosyandu(req, res) {
  const posyanduId = req.user?.posyanduId;
  if (!posyanduId) {
    res.status(400).json({ message: "User tidak terikat posyandu" });
    return null;
  }
  return posyanduId;
}

function isValidNik(nik) {
  return /^\d{16}$/.test(String(nik));
}

// async function list(req, res) {
//   const posyanduId = requirePosyandu(req, res);
//   if (!posyanduId) return;

//   const items = await anakRepo.listByPosyandu(posyanduId);
//   // console.log(items);
//   // for (item in items){
//   //   const pemeriksaan = await pemeriksaanRepo.findByIdLatest(items[item].anakId)
//   //   // console.log(items[item].anakId);
//   //   if (pemeriksaan){
//   //     items[item].statusTerbaru = pemeriksaan.klasifikasiStunting
//   //   }
//   //   console.log(items)
//   // }
//   const updatedItems = await Promise.all(items.map(async (item) => {
//     const pemeriksaan = await pemeriksaanRepo.findByIdLatest(item.anakId);
//     if (pemeriksaan) {
//       item.statusTerbaru = pemeriksaan.klasifikasiStunting;
//     }
//     return item;
//   }));
//   console.log(updatedItems);

//   res.json(updatedItems);
// }

async function list(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const items = await anakRepo.listByPosyandu(posyanduId);

  // Gunakan Promise.all agar loop await berjalan paralel & data ter-update dengan benar
  const finalItems = await Promise.all(
    items.map(async (item) => {
      const pemeriksaan = await pemeriksaanRepo.findByIdLatest(item.anakId);
      
      // Kembalikan objek baru dengan properti statusTerbaru
      return {
        ...item, // Salin semua properti asli
        statusTerbaru: pemeriksaan ? pemeriksaan.klasifikasiStunting : null
      };
    })
  );

  res.json(finalItems);
}

async function detail(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const item = await anakRepo.findDetailWithRiwayat(req.params.id, posyanduId);
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
}

async function create(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const {
    nama,
    jenisKelamin,
    tanggalLahir,
    kelurahan,
    nik
  } = req.body || {};

  // ⛔ validasi field wajib
  if (!nama || !jenisKelamin || !tanggalLahir || !kelurahan || !nik) {
    return res.status(400).json({
      message: "nama, jenisKelamin, tanggalLahir, kelurahan, nik wajib diisi",
    });
  }

  // ✅ validasi NIK (opsional)
  if (nik !== undefined && nik !== null && String(nik).trim() !== "") {
    if (!isValidNik(nik)) {
      return res.status(400).json({ message: "NIK harus 16 digit angka" });
    }
  }

  try {
    const created = await anakRepo.createForPosyandu(posyanduId, req.body);
    res.status(201).json(created);
  } catch (e) {
    if (e?.code === "P2002") {
      return res.status(409).json({ message: "NIK sudah terdaftar" });
    }
    throw e;
  }
}


async function remove(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const existing = await anakRepo.findByIdForPosyandu(req.params.id, posyanduId);
  if (!existing) return res.status(404).json({ message: "Not found" });

  await anakRepo.remove(req.params.id);
  res.json({ message: "Deleted" });
}

async function update(req, res) {
  const posyanduId = requirePosyandu(req, res);
  if (!posyanduId) return;

  const anakId = req.params.id; // ini adalah anakId (UUID)

  // cek data ada & milik posyandu ini
  const existing = await anakRepo.findByIdForPosyandu(anakId, posyanduId);
  if (!existing) {
    return res.status(404).json({ message: "Data anak tidak ditemukan" });
  }

  const {
    nama,
    jenisKelamin,
    tanggalLahir,
    kelurahan,
    nik,
    ...rest
  } = req.body || {};

  // validasi NIK bila dikirim
  if (nik !== undefined && nik !== null && String(nik).trim() !== "") {
    if (!isValidNik(nik)) {
      return res.status(400).json({ message: "NIK harus 16 digit angka" });
    }
  }

  // siapkan payload update (whitelist field)
  const payload = {
    ...(nama !== undefined && { nama }),
    ...(jenisKelamin !== undefined && { jenisKelamin }),
    ...(kelurahan !== undefined && { kelurahan }),
    ...(nik !== undefined && { nik }),
    ...(tanggalLahir !== undefined && {
      tanggalLahir: new Date(tanggalLahir)
    })
  };

  try {
    const updated = await anakRepo.updateForPosyandu(
      anakId,
      posyanduId,
      payload
    );

    res.json(updated);
  } catch (e) {
    if (e?.code === "P2002") {
      return res.status(409).json({ message: "NIK sudah terdaftar" });
    }
    throw e;
  }
}



module.exports = { list, detail, create, remove, update };
