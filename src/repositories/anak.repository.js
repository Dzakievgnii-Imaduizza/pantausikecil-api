const { prisma } = require("../db/prisma");

async function listByPosyandu(posyanduId) {
  return prisma.dataAnak.findMany({
    where: { posyanduId },
    orderBy: { createdAt: "desc" },
  });
}

async function findByIdForPosyandu(anakId, posyanduId) {
  return prisma.dataAnak.findFirst({
    where: { anakId, posyanduId },
  });
}

async function createForPosyandu(posyanduId, payload) {
  return prisma.dataAnak.create({
    data: {
      posyanduId,
      nama: payload.nama.trim(),
      nik: payload.nik ? payload.nik.trim() : null,
      jenisKelamin: payload.jenisKelamin,
      tempatLahir: payload.tempatLahir ?? null,
      tanggalLahir: new Date(payload.tanggalLahir),
      alamatAnak: payload.alamatAnak ?? null,
      rtAnak: payload.rtAnak ?? null,
      rwAnak: payload.rwAnak ?? null,
      kelurahan: payload.kelurahan ?? null,
      kecamatan: payload.kecamatan ?? null,
      kabupatenKota: payload.kabupatenKota ?? null,
      namaOrangTua: payload.namaOrangTua ?? null,
      nomorOrangTua: payload.nomorOrangTua ?? null,
    },
  });
}


async function findDetailWithRiwayat(anakId, posyanduId) {
  return prisma.dataAnak.findFirst({
    where: { anakId, posyanduId },
    include: {
      pemeriksaan: {
        orderBy: { tanggalPemeriksaan: "desc" },
      },
    },
  });
}


async function remove(anakId) {
  return prisma.dataAnak.delete({ where: { anakId } });
}

async function countAnak(posyanduId) {
  return prisma.dataAnak.count({ where: { posyanduId } })
}

async function updateForPosyandu(anakId, posyanduId, data) {
  // keamanan: pastikan data milik posyandu ini
  const existing = await prisma.dataAnak.findFirst({
    where: {
      anakId,
      posyanduId
    }
  });

  if (!existing) {
    throw new Error("DATA_NOT_FOUND_OR_FORBIDDEN");
  }

  const payload = { ...data };

  if (payload.tanggalLahir) {
    payload.tanggalLahir = new Date(payload.tanggalLahir);
  }

  delete payload.anakId;
  delete payload.posyanduId;
  delete payload.createdAt;
  delete payload.updatedAt;

  const allowed = [
    "nama",
    "jenisKelamin",
    "tanggalLahir",
    "kelurahan",
    "nik",
    "alamatAnak",
    "rtAnak",
    "rwAnak",
    "nomorOrangTua"
  ];

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowed.includes(key))
  );

  return prisma.dataAnak.update({
    where: {
      anakId
    },
    data: cleanPayload
  });
}




module.exports = {
  listByPosyandu,
  findByIdForPosyandu,
  createForPosyandu,
  findDetailWithRiwayat,
  remove,
  countAnak,
  updateForPosyandu,
};
