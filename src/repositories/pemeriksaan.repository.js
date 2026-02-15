const { prisma } = require("../db/prisma");

async function create(payload) {
  return prisma.pemeriksaan.create({ data: payload });
}

async function listByAnak(anakId) {
  return prisma.pemeriksaan.findMany({
    where: { anakId },
    orderBy: { tanggalPemeriksaan: "desc" },
  });
}

async function findById(id) {
  return prisma.pemeriksaan.findUnique({ where: { pemeriksaanId: id } });
}

async function findByIdLatest(id) {
  return prisma.pemeriksaan.findFirst({ 
    where: { anakId: id },
    orderBy: {
      tanggalPemeriksaan: "desc"
    }
   });
}


async function remove(id) {
  return prisma.pemeriksaan.delete({ where: { pemeriksaanId: id } });
}

async function totalAnakNormal(posyanduId) {
  const pemeriksaan = await prisma.pemeriksaan.findMany({
    where: {
      anak: {
        posyanduId: posyanduId
      }
    },
    select: {
      anakId: true,
      klasifikasiStunting: true,
      tanggalPemeriksaan: true
    },
    orderBy: {
      tanggalPemeriksaan: "desc"
    }
  });

  // ambil latest per anak
  const latestPerAnak = new Map();

  for (const p of pemeriksaan) {
    if (!latestPerAnak.has(p.anakId)) {
      latestPerAnak.set(p.anakId, p);
    }
  }

  let normal = 0;
  for (const p of latestPerAnak.values()) {
    if (p.klasifikasiStunting === "Normal") {
      normal++;
    }
  }

  return normal;
  
}
async function totalAnakStunting(posyanduId) {
  const pemeriksaan = await prisma.pemeriksaan.findMany({
    where: {
      anak: {
        posyanduId: posyanduId
      }
    },
    select: {
      anakId: true,
      klasifikasiStunting: true,
      tanggalPemeriksaan: true
    },
    orderBy: {
      tanggalPemeriksaan: "desc"
    }
  });

  // ambil latest per anak
  const latestPerAnak = new Map();

  for (const p of pemeriksaan) {
    if (!latestPerAnak.has(p.anakId)) {
      latestPerAnak.set(p.anakId, p);
    }
  }

  let normal = 0;
  for (const p of latestPerAnak.values()) {
    if (p.klasifikasiStunting === "Stunting") {
      normal++;
    }
  }

  return normal;
  
}
async function totalAnakBeresiko(posyanduId) {
  const pemeriksaan = await prisma.pemeriksaan.findMany({
    where: {
      anak: {
        posyanduId: posyanduId
      }
    },
    select: {
      anakId: true,
      klasifikasiStunting: true,
      tanggalPemeriksaan: true
    },
    orderBy: {
      tanggalPemeriksaan: "desc"
    }
  });

  // ambil latest per anak
  const latestPerAnak = new Map();

  for (const p of pemeriksaan) {
    if (!latestPerAnak.has(p.anakId)) {
      latestPerAnak.set(p.anakId, p);
    }
  }

  let normal = 0;
  for (const p of latestPerAnak.values()) {
    if (p.klasifikasiStunting === "Beresiko Stunting (below -1 SD)") {
      normal++;
    }
  }

  return normal;
  
}
async function totalAnakSevere(posyanduId) {
  const pemeriksaan = await prisma.pemeriksaan.findMany({
    where: {
      anak: {
        posyanduId: posyanduId
      }
    },
    select: {
      anakId: true,
      klasifikasiStunting: true,
      tanggalPemeriksaan: true
    },
    orderBy: {
      tanggalPemeriksaan: "desc"
    }
  });

  // ambil latest per anak
  const latestPerAnak = new Map();

  for (const p of pemeriksaan) {
    if (!latestPerAnak.has(p.anakId)) {
      latestPerAnak.set(p.anakId, p);
    }
  }

  let normal = 0;
  for (const p of latestPerAnak.values()) {
    if (p.klasifikasiStunting === "Stunting Berat") {
      normal++;
    }
  }

  return normal;
  
}

async function totalPemeriksaan(posyanduId) {
    return prisma.pemeriksaan.count({where : {posyanduId}})
}
module.exports = { create, listByAnak, findById, remove, totalAnakNormal, totalPemeriksaan, totalAnakStunting, totalAnakBeresiko, totalAnakSevere, findByIdLatest};
