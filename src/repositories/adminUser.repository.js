const { prisma } = require("../db/prisma");

async function listByPosyandu(posyanduId) {
  return prisma.appUser.findMany({
    where: { posyanduId },
    select: {
      userId: true,
      posyanduId: true,
      nama: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

async function findByIdForPosyandu(userId, posyanduId) {
  return prisma.appUser.findFirst({
    where: { userId, posyanduId },
    select: {
      userId: true,
      posyanduId: true,
      nama: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function createForPosyandu(posyanduId, data) {
  return prisma.appUser.create({
    data: { ...data, posyanduId },
    select: {
      userId: true,
      posyanduId: true,
      nama: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function updateForPosyandu(userId, posyanduId, data) {
  // pastikan update hanya untuk user posyandu tsb
  const existing = await prisma.appUser.findFirst({ where: { userId, posyanduId } });
  if (!existing) return null;

  return prisma.appUser.update({
    where: { userId },
    data,
    select: {
      userId: true,
      posyanduId: true,
      nama: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function deleteForPosyandu(userId, posyanduId) {
  const existing = await prisma.appUser.findFirst({
    where: { userId, posyanduId },
  });

  if (!existing) return null;

  return prisma.appUser.delete({
    where: { userId },
    select: {
      userId: true,
      nama: true,
      email: true,
      role: true,
    },
  });
}


module.exports = { listByPosyandu, findByIdForPosyandu, createForPosyandu, updateForPosyandu, deleteForPosyandu, };
