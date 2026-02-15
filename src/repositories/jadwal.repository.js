// src/repositories/jadwal.repository.js
const { prisma } = require("../db/prisma");

// LIST jadwal by posyandu + optional filters
async function listByPosyandu(posyanduId, { from, to, q } = {}) {
  const where = { posyanduId };

  if (from || to) {
    where.scheduledAt = {};
    if (from) where.scheduledAt.gte = new Date(from);
    if (to) where.scheduledAt.lte = new Date(to);
  }

  if (q) {
    where.OR = [
      { judul: { contains: q, mode: "insensitive" } },
      { kegiatan: { contains: q, mode: "insensitive" } },
    ];
  }

  return prisma.jadwal.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
  });
}

async function findByIdAndPosyandu(jadwalId, posyanduId) {
  return prisma.jadwal.findFirst({
    where: { jadwalId, posyanduId },
  });
}

async function create({ posyanduId, judul, kegiatan, scheduledAt }) {
  return prisma.jadwal.create({
    data: {
      posyanduId,
      judul,
      kegiatan: kegiatan ?? null,
      scheduledAt: new Date(scheduledAt),
    },
  });
}

async function update(jadwalId, { judul, kegiatan, scheduledAt }) {
  const data = {};
  if (judul !== undefined) data.judul = judul;
  if (kegiatan !== undefined) data.kegiatan = kegiatan ?? null;
  if (scheduledAt !== undefined) data.scheduledAt = new Date(scheduledAt);

  return prisma.jadwal.update({
    where: { jadwalId },
    data,
  });
}

async function remove(jadwalId) {
  return prisma.jadwal.delete({
    where: { jadwalId },
  });
}

module.exports = {
  listByPosyandu,
  findByIdAndPosyandu,
  create,
  update,
  remove,
};
