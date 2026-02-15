const { prisma } = require("../db/prisma");

function create(data) {
  return prisma.laporan.create({ data });
}

function listByPosyandu(posyanduId) {
  return prisma.laporan.findMany({
    where: { posyanduId },
    orderBy: { createdAt: "desc" }
  });
}

function findById(id) {
  return prisma.laporan.findUnique({ where: { laporanId: id } });
}

module.exports = { create, listByPosyandu, findById };
